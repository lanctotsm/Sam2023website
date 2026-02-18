-- Add richer image metadata fields for unified album editor
ALTER TABLE images ADD COLUMN name TEXT;
ALTER TABLE images ADD COLUMN description TEXT;
ALTER TABLE images ADD COLUMN tags TEXT;
