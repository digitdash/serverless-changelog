import { hashSecret } from "./crypto.js";
import { renderMarkdown } from "./markdown.js";
import { formatPostDate, makeId, normalizeColor, normalizeSearch, slugify } from "./utils.js";

const POST_SELECT = `
  SELECT
    p.post_id,
    p.post_date,
    p.post_date_sort,
    p.post_title,
    p.post_subtitle,
    p.post_content,
    p.password_protected,
    p.created_at,
    p.updated_at,
    COALESCE(GROUP_CONCAT(t.tag_name, '|||'), '') AS tag_names,
    COALESCE(GROUP_CONCAT(t.tag_slug, '|||'), '') AS tag_slugs,
    COALESCE(GROUP_CONCAT(t.tag_color, '|||'), '') AS tag_colors
  FROM posts p
  LEFT JOIN post_tags pt ON pt.post_id = p.post_id
  LEFT JOIN tags t ON t.tag_id = pt.tag_id
`;

function mapTags(row) {
  if (!row?.tag_names) {
    return [];
  }

  const names = String(row.tag_names).split("|||");
  const slugs = String(row.tag_slugs || "").split("|||");
  const colors = String(row.tag_colors || "").split("|||");

  return names.filter(Boolean).map((name, index) => ({
    name,
    slug: slugs[index] || slugify(name),
    color: normalizeColor(colors[index], "#ff9f43")
  }));
}

function mapPost(row, { includeContent = true } = {}) {
  if (!row) {
    return null;
  }

  return {
    postId: row.post_id,
    postDate: row.post_date,
    postDateSort: row.post_date_sort,
    title: row.post_title,
    subtitle: row.post_subtitle,
    content: row.post_content,
    contentHtml: includeContent ? renderMarkdown(row.post_content) : "",
    passwordProtected: Boolean(row.password_protected),
    tags: mapTags(row),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

export async function listTags(db) {
  const result = await db
    .prepare("SELECT tag_id, tag_name, tag_slug, tag_color FROM tags ORDER BY tag_name ASC")
    .all();

  return (result.results || []).map((row) => ({
    tagId: Number(row.tag_id),
    name: row.tag_name,
    slug: row.tag_slug,
    color: normalizeColor(row.tag_color, "#ff9f43")
  }));
}

export async function createTag(db, tagName, tagColor) {
  const now = Date.now();
  const slug = slugify(tagName);
  const color = normalizeColor(tagColor, "#ff9f43");

  await db
    .prepare("INSERT INTO tags (tag_name, tag_slug, tag_color, created_at) VALUES (?, ?, ?, ?)")
    .bind(tagName.trim(), slug, color, now)
    .run();
}

export async function updateTag(db, tagId, tagName, tagColor) {
  const slug = slugify(tagName);
  const color = normalizeColor(tagColor, "#ff9f43");

  await db
    .prepare("UPDATE tags SET tag_name = ?, tag_slug = ?, tag_color = ? WHERE tag_id = ?")
    .bind(tagName.trim(), slug, color, Number(tagId))
    .run();
}

export async function listPosts(db, { limit = 3, offset = 0, search = "" } = {}) {
  const normalized = normalizeSearch(search);
  const query = normalized
    ? `
      ${POST_SELECT}
      WHERE (
        p.post_title LIKE ? OR
        p.post_subtitle LIKE ? OR
        EXISTS (
          SELECT 1
          FROM post_tags pt_search
          INNER JOIN tags t_search ON t_search.tag_id = pt_search.tag_id
          WHERE pt_search.post_id = p.post_id
            AND t_search.tag_name LIKE ?
        )
      )
      GROUP BY p.post_id
      ORDER BY p.post_date_sort DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `
    : `
      ${POST_SELECT}
      GROUP BY p.post_id
      ORDER BY p.post_date_sort DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `;

  const statement = db.prepare(query);
  const args = normalized
    ? [`%${normalized}%`, `%${normalized}%`, `%${normalized}%`, limit + 1, offset]
    : [limit + 1, offset];

  const result = await statement.bind(...args).all();
  const rows = result.results || [];

  return {
    posts: rows.slice(0, limit).map((row) => mapPost(row)),
    hasMore: rows.length > limit
  };
}

export async function listAdminPosts(db) {
  const result = await db
    .prepare(`
      ${POST_SELECT}
      GROUP BY p.post_id
      ORDER BY p.post_date_sort DESC, p.created_at DESC
    `)
    .all();

  return (result.results || []).map((row) => mapPost(row, { includeContent: false }));
}

export async function getPostById(db, postId) {
  const row = await db
    .prepare(`
      ${POST_SELECT}
      WHERE p.post_id = ?
      GROUP BY p.post_id
    `)
    .bind(postId)
    .first();

  return mapPost(row);
}

export async function getViewerAccessSettings(db) {
  const result = await db
    .prepare(`
      SELECT setting_key, setting_value
      FROM settings
      WHERE setting_key IN ('viewer_password_enabled', 'viewer_password_hash')
    `)
    .all();

  const map = new Map((result.results || []).map((row) => [row.setting_key, row.setting_value]));

  return {
    enabled: map.get("viewer_password_enabled") === "1",
    passwordHash: String(map.get("viewer_password_hash") || "")
  };
}

export async function verifyViewerPassword(db, password) {
  const settings = await getViewerAccessSettings(db);
  if (!settings.enabled || !settings.passwordHash) {
    return true;
  }

  return (await hashSecret(password)) === settings.passwordHash;
}

export async function updateViewerAccessSettings(db, { enabled, password }) {
  const now = Date.now();
  const updates = [
    db
      .prepare("INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)")
      .bind("viewer_password_enabled", enabled ? "1" : "0", now)
      .run()
  ];

  if (enabled && password) {
    updates.push(
      db
        .prepare("INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)")
        .bind("viewer_password_hash", await hashSecret(password), now)
        .run()
    );
  }

  if (!enabled) {
    updates.push(
      db
        .prepare("INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)")
        .bind("viewer_password_hash", "", now)
        .run()
    );
  }

  await Promise.all(updates);
}

async function replacePostTags(db, postId, tagIds) {
  await db.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(postId).run();

  for (const tagId of tagIds) {
    await db
      .prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)")
      .bind(postId, Number(tagId))
      .run();
  }
}

function normalizeTagIds(rawTagIds) {
  if (Array.isArray(rawTagIds)) {
    return rawTagIds.filter(Boolean).map((value) => Number(value));
  }

  if (!rawTagIds) {
    return [];
  }

  return [Number(rawTagIds)];
}

export async function createPost(db, values) {
  const now = Date.now();
  const postId = makeId("post");
  const isoDate = values.postDateSort;

  await db
    .prepare(`
      INSERT INTO posts (
        post_id,
        post_date,
        post_date_sort,
        post_title,
        post_subtitle,
        post_content,
        password_protected,
        access_password,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      postId,
      formatPostDate(isoDate),
      isoDate,
      values.postTitle.trim(),
      values.postSubtitle.trim(),
      values.postContent.trim(),
      0,
      null,
      now,
      now
    )
    .run();

  await replacePostTags(db, postId, normalizeTagIds(values.tagIds));
  return postId;
}

export async function updatePost(db, postId, values) {
  await db
    .prepare(`
      UPDATE posts
      SET
        post_date = ?,
        post_date_sort = ?,
        post_title = ?,
        post_subtitle = ?,
        post_content = ?,
        password_protected = ?,
        access_password = ?,
        updated_at = ?
      WHERE post_id = ?
    `)
    .bind(
      formatPostDate(values.postDateSort),
      values.postDateSort,
      values.postTitle.trim(),
      values.postSubtitle.trim(),
      values.postContent.trim(),
      0,
      null,
      Date.now(),
      postId
    )
    .run();

  await replacePostTags(db, postId, normalizeTagIds(values.tagIds));
}

export async function deletePost(db, postId) {
  await db.prepare("DELETE FROM posts WHERE post_id = ?").bind(postId).run();
}

export async function createInquiry(db, values) {
  const inquiryId = makeId("inquiry");
  const now = Date.now();

  await db
    .prepare(`
      INSERT INTO inquiries (
        inquiry_id,
        inquiry_type,
        inquiry_name,
        inquiry_email,
        inquiry_phone,
        inquiry_content,
        inquiry_date,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      inquiryId,
      values.inquiryType,
      values.inquiryName.trim(),
      values.inquiryEmail.trim(),
      values.inquiryPhone.trim(),
      values.inquiryContent.trim(),
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(now)),
      now
    )
    .run();

  return inquiryId;
}
