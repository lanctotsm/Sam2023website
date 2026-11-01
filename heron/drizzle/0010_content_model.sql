-- Album publishing, optional cover and display date, stored post HTML, and saved site templates.
ALTER TABLE albums ADD COLUMN status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE albums ADD COLUMN cover_image_id INTEGER;
ALTER TABLE albums ADD COLUMN display_date TEXT;

ALTER TABLE posts ADD COLUMN cover_image_id INTEGER;
ALTER TABLE posts ADD COLUMN html TEXT;

CREATE TABLE IF NOT EXISTS site_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
