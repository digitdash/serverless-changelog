import { isAdminAuthenticated } from "../../../lib/auth.js";
import { getViewerAccessSettings, updateViewerAccessSettings } from "../../../lib/db.js";
import { getDb } from "../../../lib/env.js";
import { redirect } from "../../../lib/http.js";

export async function POST(context) {
  if (!await isAdminAuthenticated(context)) {
    return redirect("/admin?error=Please+log+in");
  }

  const db = getDb(context.locals);
  const formData = await context.request.formData();
  const enabled = formData.get("viewerPasswordEnabled") === "on";
  const password = String(formData.get("viewerPassword") || "");
  const current = await getViewerAccessSettings(db);

  if (enabled && !password && !current.enabled) {
    return redirect("/admin?error=Provide+a+viewer+password+when+enabling+site+protection");
  }

  try {
    await updateViewerAccessSettings(db, { enabled, password });
    return redirect("/admin?success=viewer-access-updated");
  } catch (error) {
    return redirect(`/admin?error=${encodeURIComponent(error.message || "Could not update viewer access settings.")}`);
  }
}
