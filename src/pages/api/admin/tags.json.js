import { isAdminAuthenticated } from "../../../lib/auth.js";
import { createTag, listTags } from "../../../lib/db.js";
import { getDb } from "../../../lib/env.js";
import { json, redirect } from "../../../lib/http.js";
import { normalizeColor } from "../../../lib/utils.js";

export async function GET(context) {
  if (!await isAdminAuthenticated(context)) {
    return json({ ok: false }, 401);
  }

  const db = getDb(context.locals);
  return json({ ok: true, tags: await listTags(db) });
}

export async function POST(context) {
  if (!await isAdminAuthenticated(context)) {
    return redirect("/admin?error=Please+log+in");
  }

  const db = getDb(context.locals);
  const formData = await context.request.formData();
  const tagName = String(formData.get("tagName") || "").trim();
  const tagColor = normalizeColor(formData.get("tagColor"), "#ff9f43");

  if (!tagName) {
    return redirect(`/admin?error=${encodeURIComponent("Tag name is required.")}`);
  }

  try {
    await createTag(db, tagName, tagColor);
    return redirect("/admin?success=tag-created");
  } catch (error) {
    return redirect(`/admin?error=${encodeURIComponent(error.message || "Could not create tag.")}`);
  }
}
