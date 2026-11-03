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

## Removing orphaned media

Run this only with the database and S3 bucket for the same environment. The CLI
requires an explicit `CMS_DB_PATH` and the usual S3 environment variables; it does
not automatically load `.env` files. Missing, unreadable, invalid, or empty-reference
databases abort before contacting S3, rather than treating every upload as an orphan.

From `heron/`, with the matching environment already exported:

```bash
# Preview candidates without deleting anything (the default).
CMS_DB_PATH=/absolute/path/to/cms.db npm run cleanup:orphan-s3

# After reviewing the printed database, bucket, and candidate keys:
CMS_DB_PATH=/absolute/path/to/cms.db npm run cleanup:orphan-s3 -- --apply
```

Only unreferenced objects under `uploads/` that are at least 24 hours old are
eligible. `CLEANUP_ORPHAN_STALE_HOURS` can increase this grace period; values below
24 and malformed values are rejected. Objects with missing/invalid modification
dates are preserved. References are read again before each deletion batch so that
objects linked while listing are preserved. Avoid running cleanup during database
restores or media imports; the age check and reference rechecks cannot make a
database update and an S3 deletion one atomic operation.

`CLEANUP_ORPHAN_DRY_RUN=false` no longer enables deletion: only `--apply` does.
`CLEANUP_ORPHAN_DRY_RUN=true` combined with `--apply` is rejected to avoid conflicting
instructions. An intentionally empty media library requires a separate, reviewed
recovery procedure; this command will not clear a bucket based on an empty database.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js
- **Media**: S3-compatible storage
