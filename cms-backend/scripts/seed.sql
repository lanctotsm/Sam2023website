INSERT INTO posts (title, slug, summary, markdown, status, published_at)
VALUES
  ('Hello Lightsail', 'hello-lightsail', 'First post', '## Welcome', 'published', NOW());

INSERT INTO albums (title, slug, description)
VALUES
  ('Sample Album', 'sample-album', 'A starter album');
