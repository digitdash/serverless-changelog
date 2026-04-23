import { createInquiry, getViewerAccessSettings } from "../../lib/db.js";
import { hasViewerAccess } from "../../lib/auth.js";
import { getDb } from "../../lib/env.js";
import { json } from "../../lib/http.js";
import { enforceRateLimit } from "../../lib/rate-limit.js";
import { getClientIp } from "../../lib/utils.js";

export async function POST(context) {
  const db = getDb(context.locals);
  const access = await getViewerAccessSettings(db);
  if (access.enabled && !await hasViewerAccess(context)) {
    return json({ ok: false, error: "Viewer authentication required." }, 401);
  }

  const ip = getClientIp(context.request);

  const limit = await enforceRateLimit({
    db,
    key: ip,
    action: "inquiry-submit",
    limit: 5,
    windowMs: 1000 * 60 * 60
  });

  if (!limit.ok) {
    return json(
      {
        ok: false,
        error: `You have reached the submission limit. Try again in ${limit.retryAfter} seconds.`
      },
      429
    );
  }

  const formData = await context.request.formData();
  const inquiryType = String(formData.get("inquiryType") || "");
  const inquiryName = String(formData.get("inquiryName") || "");
  const inquiryEmail = String(formData.get("inquiryEmail") || "");
  const inquiryPhone = String(formData.get("inquiryPhone") || "");
  const inquiryContent = String(formData.get("inquiryContent") || "");

  if (!["question", "idea"].includes(inquiryType)) {
    return json({ ok: false, error: "Choose question or idea." }, 400);
  }

  if (!inquiryName || !inquiryEmail || !inquiryPhone || !inquiryContent) {
    return json({ ok: false, error: "All inquiry fields are required." }, 400);
  }

  await createInquiry(db, {
    inquiryType,
    inquiryName,
    inquiryEmail,
    inquiryPhone,
    inquiryContent
  });

  return json({
    ok: true,
    message: "Your message has been recorded."
  });
}
