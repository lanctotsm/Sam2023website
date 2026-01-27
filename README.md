# Heron

This repo hosts the Lightsail rewrite as a single Next.js app (`heron/app`) with a SQLite database.

## Local development

1. Copy `.env.example` to `.env` and update values.
2. Run `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`.
3. Visit `http://localhost:3000`.

### Local photo upload testing (MinIO)

The dev compose file runs MinIO (local S3), seeds a starter album, and enables a dev login.

1. Seed the database (admin email and starter album):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml exec heron npm run seed:local
   ```
2. Visit `http://localhost:3000/login` and click **Dev login (local)**.
3. Visit `http://localhost:3000/upload` and upload a photo.

## Deployment

See `infra/lightsail-cms.yaml`.