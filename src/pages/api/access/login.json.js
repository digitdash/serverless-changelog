import { grantViewerAccess } from "../../../lib/auth.js";
import { verifyViewerPassword } from "../../../lib/db.js";
import { getDb } from "../../../lib/env.js";
import { redirect } from "../../../lib/http.js";
import { enforceRateLimit } from "../../../lib/rate-limit.js";
import { getClientIp } from "../../../lib/utils.js";

export async function POST(context) {
  const db = getDb(context.locals);
  const ip = getClientIp(context.request);
  const formData = await context.request.formData();
  const password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "/");
  const destination = returnTo.startsWith("/") ? returnTo : "/";

  const limit = await enforceRateLimit({
    db,
    key: ip,
    action: "viewer-login",
    limit: 8,
    windowMs: 1000 * 60 * 15
  });

  if (!limit.ok) {
    return redirect(`${destination}?error=${encodeURIComponent(`Too many attempts. Try again in ${limit.retryAfter} seconds.`)}`);
  }

  const valid = await verifyViewerPassword(db, password);
  if (!valid) {
    return redirect(`${destination}?error=${encodeURIComponent("Incorrect viewer password.")}`);
  }

  try {
    await grantViewerAccess(context);
    return redirect(destination);
  } catch (error) {
    return redirect(`${destination}?error=${encodeURIComponent(error.message || "Viewer access could not be granted.")}`);
  }
}
