import { getRuntimeEnv } from "./env.js";
import { signPayload, verifyPayload } from "./crypto.js";

const ADMIN_COOKIE = "admin_session";
const VIEWER_COOKIE = "viewer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const VIEWER_ACCESS_TTL_MS = 1000 * 60 * 60 * 8;

function getSecret(locals) {
  const env = getRuntimeEnv(locals);
  return env.SESSION_SECRET || "";
}

function useSecureCookies(request) {
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return true;
  }
}

export async function isAdminAuthenticated(context) {
  const secret = getSecret(context.locals);
  if (!secret) {
    return false;
  }

  const token = context.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) {
    return false;
  }

  const payload = await verifyPayload(token, secret);
  return Boolean(payload?.scope === "admin");
}

export async function createAdminSession(context) {
  const secret = getSecret(context.locals);
  if (!secret) {
    throw new Error("SESSION_SECRET is required to create admin sessions.");
  }

  const token = await signPayload(
    {
      scope: "admin",
      exp: Date.now() + SESSION_TTL_MS
    },
    secret
  );

  context.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(context.request),
    path: "/",
    maxAge: SESSION_TTL_MS / 1000
  });
}

export function clearAdminSession(context) {
  context.cookies.delete(ADMIN_COOKIE, {
    path: "/"
  });
}

export async function grantViewerAccess(context) {
  const secret = getSecret(context.locals);
  if (!secret) {
    throw new Error("SESSION_SECRET is required to grant viewer access.");
  }

  const token = await signPayload(
    {
      scope: "viewer",
      exp: Date.now() + VIEWER_ACCESS_TTL_MS
    },
    secret
  );

  context.cookies.set(VIEWER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(context.request),
    path: "/",
    maxAge: VIEWER_ACCESS_TTL_MS / 1000
  });
}

export async function hasViewerAccess(context) {
  const secret = getSecret(context.locals);
  if (!secret) {
    return false;
  }

  const token = context.cookies.get(VIEWER_COOKIE)?.value;
  if (!token) {
    return false;
  }

  const payload = await verifyPayload(token, secret);
  return payload?.scope === "viewer";
}

export function clearViewerAccess(context) {
  context.cookies.delete(VIEWER_COOKIE, {
    path: "/"
  });
}
