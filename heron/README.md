# Heron CMS

Next.js application for public posts, photo albums, and admin content management.

## Setup

1. Copy `.env.example` from the root to a `.env` file in the root and configure values.
2. If running locally without Docker:
   - Install dependencies: `cd heron && npm install`
   - Run development server: `npm run dev`
3. If running with Docker (recommended):
   - Use `docker compose -f docker-compose.dev.yml up --build` from the root.

## Seeding the Database

To seed a local SQLite database with a starter album and admin email:

```bash
# Using Docker
docker compose exec heron npm run seed:local

# Locally
cd heron && npm run seed:local
```

## E2E Tests (Playwright)

`npm run test:e2e` now:
- ensures local SQLite DB file exists
- starts/checks MinIO + app + bucket init via Docker
- runs Playwright tests

```bash
npm run test:e2e
```

If you want the full stack running in Docker first:

```bash
# Rebuild and start the full stack, then run tests
npm run test:e2e:docker
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js
- **Media**: S3-compatible storage
