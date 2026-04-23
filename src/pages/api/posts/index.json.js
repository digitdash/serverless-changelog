import { getDb } from "../../../lib/env.js";
import { hasViewerAccess } from "../../../lib/auth.js";
import { getViewerAccessSettings, listPosts } from "../../../lib/db.js";
import { json } from "../../../lib/http.js";

export async function GET(context) {
  const db = getDb(context.locals);
  const access = await getViewerAccessSettings(db);

  if (access.enabled && !await hasViewerAccess(context)) {
    return json({ ok: false, error: "Viewer authentication required." }, 401);
  }

  const url = new URL(context.request.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
  const limit = Math.min(12, Math.max(1, Number(url.searchParams.get("limit") || 3)));
  const search = url.searchParams.get("search") || "";

  const { posts, hasMore } = await listPosts(db, {
    offset,
    limit,
    search
  });

  const payload = posts.map((post) => ({
    postId: post.postId,
    postDate: post.postDate,
    title: post.title,
    subtitle: post.subtitle,
    tags: post.tags,
    contentHtml: post.contentHtml
  }));

  return json({
    ok: true,
    posts: payload,
    hasMore
  });
}
