-- Track internal images uploaded/owned by posts
CREATE TABLE IF NOT EXISTS post_inline_images (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'upload_insert',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_post_inline_images_post_id ON post_inline_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_inline_images_image_id ON post_inline_images(image_id);
