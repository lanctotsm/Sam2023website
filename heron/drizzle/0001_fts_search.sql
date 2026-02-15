-- FTS5 virtual tables for full-text search on posts and albums
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title,
  summary,
  markdown,
  content='posts',
  content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS albums_fts USING fts5(
  title,
  description,
  content='albums',
  content_rowid='id'
);

-- Triggers to keep posts_fts in sync with posts
CREATE TRIGGER IF NOT EXISTS posts_fts_insert AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts(rowid, title, summary, markdown) VALUES (new.id, new.title, new.summary, new.markdown);
END;
CREATE TRIGGER IF NOT EXISTS posts_fts_update AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, summary, markdown) VALUES ('delete', old.id, old.title, old.summary, old.markdown);
  INSERT INTO posts_fts(rowid, title, summary, markdown) VALUES (new.id, new.title, new.summary, new.markdown);
END;
CREATE TRIGGER IF NOT EXISTS posts_fts_delete AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts(posts_fts, rowid, title, summary, markdown) VALUES ('delete', old.id, old.title, old.summary, old.markdown);
END;

-- Triggers to keep albums_fts in sync with albums
CREATE TRIGGER IF NOT EXISTS albums_fts_insert AFTER INSERT ON albums BEGIN
  INSERT INTO albums_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
END;
CREATE TRIGGER IF NOT EXISTS albums_fts_update AFTER UPDATE ON albums BEGIN
  INSERT INTO albums_fts(albums_fts, rowid, title, description) VALUES ('delete', old.id, old.title, old.description);
  INSERT INTO albums_fts(rowid, title, description) VALUES (new.id, new.title, new.description);
END;
CREATE TRIGGER IF NOT EXISTS albums_fts_delete AFTER DELETE ON albums BEGIN
  INSERT INTO albums_fts(albums_fts, rowid, title, description) VALUES ('delete', old.id, old.title, old.description);
END;

-- Initial population from existing rows
INSERT INTO posts_fts(posts_fts) VALUES('rebuild');
INSERT INTO albums_fts(albums_fts) VALUES('rebuild');
