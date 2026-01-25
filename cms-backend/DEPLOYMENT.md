# Lightsail Deployment Guide

## Local development (Docker Compose)

1. Copy `.env.example` to `.env` in the repo root.
2. Fill in `GOOGLE_*`, `S3_*`, and `AWS_*` values.
3. Run: `docker compose up -d --build`
4. Open:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:8080`

Notes:
- `NEXT_PUBLIC_IMAGE_BASE_URL` should point at your CloudFront domain in `.env`.
- Use `ALLOWED_ORIGINS=http://localhost:3000` for local CORS.

## Lightsail VM setup

1. Create a Lightsail instance (Ubuntu LTS).
2. Attach a static IP.
3. Open ports 22, 80, and 443 in the firewall.
4. Install Docker and the Compose plugin:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
```

5. Create an app directory:

```bash
sudo mkdir -p /opt/sam-cms
sudo chown -R ubuntu:ubuntu /opt/sam-cms
```

## Application deployment

1. Sync the repo (or use the GitHub Actions deploy workflow).
2. Create `/opt/sam-cms/.env` with production values:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://your-domain/auth/callback
S3_REGION=us-east-1
S3_BUCKET=your-bucket
S3_PUBLIC_BASE_URL=https://your-cloudfront-domain
AWS_USE_STATIC_CREDS=true
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
ALLOWED_ORIGINS=https://your-domain
COOKIE_SECURE=true
```

3. Run the stack:

```bash
cd /opt/sam-cms
docker compose up -d --build
```

## TLS and reverse proxy

Use Nginx or Caddy to terminate TLS and proxy to:
- `cms-frontend` on `localhost:3000`
- `cms-backend` on `localhost:8080`

Make sure the API and frontend are served from the same domain so the session
cookie is shared. If you use Nginx, proxy `/auth`, `/posts`, `/albums`, and
`/images` to the backend.

## Backups

Add a nightly cron job to dump Postgres:

```bash
pg_dump "$DATABASE_URL" | gzip > /var/backups/cms-backend/backup-$(date +%F).sql.gz
```

Keep the latest 7 days via logrotate or a cleanup cron.
