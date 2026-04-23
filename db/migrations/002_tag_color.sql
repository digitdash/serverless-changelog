ALTER TABLE tags ADD COLUMN tag_color TEXT NOT NULL DEFAULT '#ff9f43';

UPDATE tags
SET tag_color = CASE tag_slug
  WHEN 'breaking-change' THEN '#ff8b8b'
  WHEN 'milestone' THEN '#87e1c7'
  WHEN 'feedback' THEN '#ffd36e'
  WHEN 'product' THEN '#8ec5ff'
  ELSE '#ff9f43'
END
WHERE tag_color IS NULL OR tag_color = '';
