export async function enforceRateLimit({
  db,
  key,
  action,
  limit,
  windowMs
}) {
  const now = Date.now();
  const windowStart = now - (now % windowMs);
  const expiresAt = windowStart + windowMs;
  const rateKey = `${action}:${key}:${windowStart}`;

  await db
    .prepare(
      `INSERT OR IGNORE INTO rate_limits (rate_key, action, window_start, expires_at, hits)
       VALUES (?, ?, ?, ?, 0)`
    )
    .bind(rateKey, action, windowStart, expiresAt)
    .run();

  await db
    .prepare("UPDATE rate_limits SET hits = hits + 1 WHERE rate_key = ?")
    .bind(rateKey)
    .run();

  const record = await db
    .prepare("SELECT hits, expires_at FROM rate_limits WHERE rate_key = ?")
    .bind(rateKey)
    .first();

  await db
    .prepare("DELETE FROM rate_limits WHERE expires_at < ?")
    .bind(now - 1000)
    .run();

  const hits = Number(record?.hits || 0);
  const retryAfter = Math.max(1, Math.ceil((Number(record?.expires_at || expiresAt) - now) / 1000));

  return {
    ok: hits <= limit,
    hits,
    retryAfter
  };
}
