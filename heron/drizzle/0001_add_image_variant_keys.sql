-- Add variant S3 key columns for thumb, large, and original image sizes
ALTER TABLE images ADD COLUMN s3_key_thumb TEXT;
ALTER TABLE images ADD COLUMN s3_key_large TEXT;
ALTER TABLE images ADD COLUMN s3_key_original TEXT;
