# CMS Backend

Go API for the Lightsail CMS rewrite. Provides OAuth login, CRUD for posts/albums/images, and S3 presigned uploads.

## Required Environment Variables

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`
- `S3_REGION`
- `S3_BUCKET`
- `S3_PUBLIC_BASE_URL`

Optional:
- `PORT` (default `8080`)
- `SESSION_DURATION` (default `24h`)
- `SESSION_COOKIE_NAME` (default `cms_session`)
- `COOKIE_SECURE` (default `false`)
- `ALLOWED_ORIGINS` (comma-separated)
- `FRONTEND_BASE_URL` (redirect after login)
- `AWS_USE_STATIC_CREDS` (`true` to use access keys)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Run Locally

1. Start Postgres (see `docker-compose.yml` in repo root).
2. Set env vars.
3. `go run ./`

Migrations run automatically on startup from `internal/db/migrations`.
