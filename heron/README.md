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

E2E tests expect the app on localhost:3000 with MinIO and a seeded DB. Use Docker:

```bash
# Rebuild and start the full stack, then run tests
npm run test:e2e:docker
```

Or manually: from the repo root, `docker compose -f docker-compose.dev.yml up --build`, then from heron/ run `npm run test:e2e`.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js
- **Media**: S3-compatible storage
