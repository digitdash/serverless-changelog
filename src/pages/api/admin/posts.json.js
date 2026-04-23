import { isAdminAuthenticated } from "../../../lib/auth.js";
import { createPost, listAdminPosts } from "../../../lib/db.js";
import { getDb } from "../../../lib/env.js";
import { parsePostFormData, validatePostValues } from "../../../lib/forms.js";
import { json, redirect } from "../../../lib/http.js";

export async function GET(context) {
  if (!await isAdminAuthenticated(context)) {
    return json({ ok: false }, 401);
  }

  const db = getDb(context.locals);
  return json({
    ok: true,
    posts: await listAdminPosts(db)
  });
}

export async function POST(context) {
  if (!await isAdminAuthenticated(context)) {
    return redirect("/admin?error=Please+log+in");
  }

  const db = getDb(context.locals);
  const formData = await context.request.formData();
  const values = parsePostFormData(formData);
  const error = validatePostValues(values);

  if (error) {
    return redirect(`/admin?error=${encodeURIComponent(error)}`);
  }

  try {
    const postId = await createPost(db, values);
    return redirect(`/admin?success=${encodeURIComponent(`post-created:${postId}`)}`);
  } catch (routeError) {
    return redirect(`/admin?error=${encodeURIComponent(routeError.message || "Could not create post.")}`);
  }
}
