# Lightsail Deployment Guide

## VM setup

1. Create a Lightsail instance (Ubuntu LTS).
2. Attach a static IP.
3. Open ports 80 and 443 in the firewall.
4. Install Docker and docker-compose.

## Services

- `cms-backend` (Go API)
- `cms-frontend` (Next.js)
- `postgres` (local database)
- `nginx` (reverse proxy + TLS)

## Compose Layout

Use the repo `docker-compose.yml` from the server root directory.

## TLS

1. Point DNS to the Lightsail static IP.
2. Install Certbot and generate certs for your domain.
3. Configure Nginx with the generated certs.

## Backups

Add a nightly cron job to dump Postgres:

```bash
pg_dump "$DATABASE_URL" | gzip > /var/backups/cms-backend/backup-$(date +%F).sql.gz
```

Keep the latest 7 days via logrotate or a cleanup cron.
