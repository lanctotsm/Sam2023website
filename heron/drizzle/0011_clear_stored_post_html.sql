-- Stored HTML predates URL sanitization. Clear it so the next read re-renders.
UPDATE posts SET html = NULL;
