function encodeBase64Url(value) {
  const base64 = (typeof btoa === "function"
    ? btoa(value)
    : Buffer.from(value, "utf-8").toString("base64"));

  return base64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4 || 4)) % 4)}`;

  return typeof atob === "function"
    ? atob(padded)
    : Buffer.from(padded, "base64").toString("utf-8");
}

async function digest(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashSecret(value) {
  return digest(String(value || ""));
}

export async function signPayload(payload, secret) {
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = await digest(`${encoded}.${secret}`);
  return `${encoded}.${signature}`;
}

export async function verifyPayload(token, secret) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  const expected = await digest(`${encoded}.${secret}`);

  if (expected !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encoded));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
