export function getRuntimeEnv(locals) {
  const runtime = locals?.runtime;

  if (!runtime?.env?.DB) {
    throw new Error("Cloudflare runtime or D1 binding is not available.");
  }

  return runtime.env;
}

export function getDb(locals) {
  return getRuntimeEnv(locals).DB;
}

export function getSiteConfig(locals) {
  const env = getRuntimeEnv(locals);

  return {
    siteName: env.SITE_NAME || "Junglebet",
    siteTagline: env.SITE_TAGLINE || "Investor changelog and project updates"
  };
}
