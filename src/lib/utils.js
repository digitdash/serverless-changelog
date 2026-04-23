export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatPostDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function formatDateTimeLabel(dateValue) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(dateValue));
}

export function normalizeSearch(value) {
  return String(value || "").trim();
}

export function getClientIp(request) {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) {
    return cf;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return "unknown";
  }

  return forwarded.split(",")[0].trim() || "unknown";
}

export function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
}

export function normalizeColor(value, fallback = "#ff9f43") {
  const normalized = String(value || "").trim();
  return /^#([0-9a-f]{6})$/i.test(normalized) ? normalized.toLowerCase() : fallback;
}

export function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
