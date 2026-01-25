INSERT INTO posts (title, slug, summary, markdown, status, published_at)
VALUES
  ('Hello Lightsail', 'hello-lightsail', 'First post', '## Welcome', 'published', NOW());

INSERT INTO albums (title, slug, description)
VALUES
  ('Sample Album', 'sample-album', 'A starter album');

INSERT INTO images (s3_key, width, height, caption, alt_text)
VALUES
  ('seed/sample-cover.jpg', 1600, 1067, 'Sample cover', 'Sample album cover');

INSERT INTO album_images (album_id, image_id, sort_order)
VALUES
  (
    (SELECT id FROM albums WHERE slug = 'sample-album'),
    (SELECT id FROM images WHERE s3_key = 'seed/sample-cover.jpg'),
    0
  );

INSERT INTO post_album_links (post_id, album_id)
VALUES
  (
    (SELECT id FROM posts WHERE slug = 'hello-lightsail'),
    (SELECT id FROM albums WHERE slug = 'sample-album')
  );
