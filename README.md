# Sam's Lightsail CMS

This repo hosts the Lightsail rewrite: a Go API (`cms-backend`) and a Next.js app (`cms-frontend`).

## Local development

1. Copy `.env.example` to `.env` and update values.
2. Run `docker compose up --build`.
3. Visit `http://localhost:3000`.

## Deployment

See `cms-backend/DEPLOYMENT.md` and `infra/lightsail-cms.yaml`.