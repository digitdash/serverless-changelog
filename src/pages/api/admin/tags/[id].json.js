import { isAdminAuthenticated } from "../../../../lib/auth.js";
import { getDb } from "../../../../lib/env.js";
import { redirect } from "../../../../lib/http.js";
import { updateTag } from "../../../../lib/db.js";
import { normalizeColor } from "../../../../lib/utils.js";

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
    await updateTag(db, context.params.id, tagName, tagColor);
    return redirect("/admin?success=tag-updated");
  } catch (error) {
    return redirect(`/admin?error=${encodeURIComponent(error.message || "Could not update tag.")}`);
  }
}
