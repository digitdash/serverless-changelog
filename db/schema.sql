PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS posts (
  post_id TEXT PRIMARY KEY,
  post_date TEXT NOT NULL,
  post_date_sort TEXT NOT NULL,
  post_title TEXT NOT NULL,
  post_subtitle TEXT NOT NULL,
  post_content TEXT NOT NULL,
  password_protected INTEGER NOT NULL DEFAULT 0,
  access_password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_name TEXT NOT NULL UNIQUE,
  tag_slug TEXT NOT NULL UNIQUE,
  tag_color TEXT NOT NULL DEFAULT '#ff9f43',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inquiries (
  inquiry_id TEXT PRIMARY KEY,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('question', 'idea')),
  inquiry_name TEXT NOT NULL,
  inquiry_email TEXT NOT NULL,
  inquiry_phone TEXT NOT NULL,
  inquiry_content TEXT NOT NULL,
  inquiry_date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_posts_sort ON posts(post_date_sort DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(tag_slug);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expire ON rate_limits(expires_at);

INSERT OR IGNORE INTO settings (setting_key, setting_value, updated_at)
VALUES
  ('viewer_password_enabled', '0', strftime('%s', 'now')),
  ('viewer_password_hash', '', strftime('%s', 'now'));
