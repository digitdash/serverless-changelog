INSERT OR IGNORE INTO tags (tag_name, tag_slug, tag_color, created_at)
VALUES
  ('Breaking Change', 'breaking-change', '#ff8b8b', strftime('%s', 'now')),
  ('Milestone', 'milestone', '#87e1c7', strftime('%s', 'now')),
  ('Feedback', 'feedback', '#ffd36e', strftime('%s', 'now')),
  ('Product', 'product', '#8ec5ff', strftime('%s', 'now'));

INSERT OR IGNORE INTO posts (
  post_id,
  post_date,
  post_date_sort,
  post_title,
  post_subtitle,
  post_content,
  password_protected,
  access_password,
  created_at,
  updated_at
)
VALUES
  (
    'post_launch_001',
    '01 Apr 2026',
    '2026-04-01',
    'Beta Dashboard Rolled Out',
    'The internal investor preview now reflects the newest telemetry pipeline.',
    '## What changed

- Completed the latest sync between the embedded device stream and the reporting backend.
- Added a cleaner investor-facing summary layer for milestones and issues.
- Finalized the first-pass changelog workflow for internal distribution.

![Dashboard preview](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80)

We are now using the changelog itself as a structured project record for stakeholders.',
    0,
    NULL,
    strftime('%s', 'now'),
    strftime('%s', 'now')
  ),
  (
    'post_ops_002',
    '26 Mar 2026',
    '2026-03-26',
    'Field Test Learnings',
    'Performance stayed stable during our latest hardware validation run.',
    '### Key observations

- Thermal capture latency remained inside the target envelope.
- TCP streaming was reliable under repeated reconnect scenarios.
- We identified two firmware-side logging gaps now queued for remediation.',
    0,
    NULL,
    strftime('%s', 'now'),
    strftime('%s', 'now')
  ),
  (
    'post_secure_003',
    '12 Mar 2026',
    '2026-03-12',
    'Confidential Budget Update',
    'Budget and planning notes for the next execution window.',
    '## Budget note

This entry demonstrates the changelog content stream once the full site access gate is enabled for investor viewers.',
    0,
    NULL,
    strftime('%s', 'now'),
    strftime('%s', 'now')
  );

INSERT OR IGNORE INTO post_tags (post_id, tag_id)
SELECT 'post_launch_001', tag_id FROM tags WHERE tag_slug IN ('milestone', 'product');

INSERT OR IGNORE INTO post_tags (post_id, tag_id)
SELECT 'post_ops_002', tag_id FROM tags WHERE tag_slug IN ('feedback');

INSERT OR IGNORE INTO post_tags (post_id, tag_id)
SELECT 'post_secure_003', tag_id FROM tags WHERE tag_slug IN ('breaking-change');
