-- Local-dev seed data
-- Clear existing albums and related data
DELETE FROM post_album_links;
DELETE FROM album_images;
DELETE FROM albums;

-- Note: created_by is nullable, seed data has no creator (system-created)
INSERT INTO albums (title, slug, description, created_by)
VALUES ('Local Test Album', 'local-test-album', 'Starter album for local upload testing', NULL);
