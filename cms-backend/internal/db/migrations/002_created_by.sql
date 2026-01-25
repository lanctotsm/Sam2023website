-- Add created_by metadata to track who created content (optional, nullable for existing data)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE images ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for potential future queries
CREATE INDEX IF NOT EXISTS idx_posts_created_by ON posts(created_by);
CREATE INDEX IF NOT EXISTS idx_albums_created_by ON albums(created_by);
CREATE INDEX IF NOT EXISTS idx_images_created_by ON images(created_by);
