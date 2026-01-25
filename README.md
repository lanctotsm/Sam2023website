# Sam's Lightsail CMS

This repo hosts the Lightsail rewrite: a Go API (`cms-backend`) and a Next.js app (`cms-frontend`).

## Local development

1. Copy `.env.example` to `.env` and update values.
2. Run `docker compose up --build`. (production-like)
3. Visit `http://localhost:3000`.

### Local photo upload testing (MinIO)

Use the dev compose file to run MinIO (local S3), seed a starter album, and enable a dev login.

1. Copy `.env.example` to `.env` (defaults are set up for MinIO + dev login).
2. Run `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build`.
3. Visit `http://localhost:3000/login` and click **Dev login (local)**.
4. Visit `http://localhost:3000/upload` and upload a photo (a starter album is auto-seeded).

## Deployment

See `cms-backend/DEPLOYMENT.md` and `infra/lightsail-cms.yaml`.