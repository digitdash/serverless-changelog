import { isAdminAuthenticated } from "../../../../lib/auth.js";
import { deletePost, getPostById, updatePost } from "../../../../lib/db.js";
import { getDb } from "../../../../lib/env.js";
import { parsePostFormData, validatePostValues } from "../../../../lib/forms.js";
import { json, redirect } from "../../../../lib/http.js";

export async function GET(context) {
  if (!await isAdminAuthenticated(context)) {
    return json({ ok: false }, 401);
  }

  const db = getDb(context.locals);
  const post = await getPostById(db, context.params.id);

  if (!post) {
    return json({ ok: false, error: "Post not found." }, 404);
  }

  return json({ ok: true, post });
}

export async function POST(context) {
  if (!await isAdminAuthenticated(context)) {
    return redirect("/admin?error=Please+log+in");
  }

  const db = getDb(context.locals);
  const postId = context.params.id;
  const formData = await context.request.formData();
  const intent = String(formData.get("_intent") || "update");

  if (intent === "delete") {
    await deletePost(db, postId);
    return redirect("/admin?success=post-deleted");
  }

  const values = parsePostFormData(formData);
  const error = validatePostValues(values);

  if (error) {
    return redirect(`/admin/edit/${postId}?error=${encodeURIComponent(error)}`);
  }

  try {
    await updatePost(db, postId, values);
    return redirect(`/admin/edit/${postId}?success=post-updated`);
  } catch (routeError) {
    return redirect(`/admin/edit/${postId}?error=${encodeURIComponent(routeError.message || "Could not update post.")}`);
  }
}
