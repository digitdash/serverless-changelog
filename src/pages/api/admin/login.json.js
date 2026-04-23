import { createAdminSession } from "../../../lib/auth.js";
import { getRuntimeEnv, getDb } from "../../../lib/env.js";
import { redirect } from "../../../lib/http.js";
import { enforceRateLimit } from "../../../lib/rate-limit.js";
import { getClientIp } from "../../../lib/utils.js";

export async function POST(context) {
  const db = getDb(context.locals);
  const env = getRuntimeEnv(context.locals);
  const ip = getClientIp(context.request);

  const limit = await enforceRateLimit({
    db,
    key: ip,
    action: "admin-login",
    limit: 5,
    windowMs: 1000 * 60 * 15
  });

  if (!limit.ok) {
    return redirect(`/admin?error=${encodeURIComponent("Too many login attempts. Please wait.")}`);
  }

  const formData = await context.request.formData();
  const password = String(formData.get("password") || "");

  if (!env.ADMIN_PASSWORD || password !== env.ADMIN_PASSWORD) {
    return redirect(`/admin?error=${encodeURIComponent("Incorrect admin password.")}`);
  }

  try {
    await createAdminSession(context);
    return redirect("/admin");
  } catch (error) {
    return redirect(`/admin?error=${encodeURIComponent(error.message || "Admin session could not be created.")}`);
  }
}
