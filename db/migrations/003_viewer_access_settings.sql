CREATE TABLE IF NOT EXISTS settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO settings (setting_key, setting_value, updated_at)
VALUES
  ('viewer_password_enabled', '0', strftime('%s', 'now')),
  ('viewer_password_hash', '', strftime('%s', 'now'));

UPDATE posts
SET
  password_protected = 0,
  access_password = NULL
WHERE password_protected = 1 OR access_password IS NOT NULL;
