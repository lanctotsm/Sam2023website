# Heron CMS

Next.js application for public posts, photo albums, and admin content management.

## Setup

1. Copy `.env.example` from the root to a `.env` file in the root and configure values.
2. If running locally without Docker:
   - Install dependencies: `cd heron && npm install`
   - Run development server: `npm run dev`
3. If running with Docker (recommended):
   - Use `docker compose -f docker-compose.dev.yml up` from the root.

## Seeding the Database

To seed a local SQLite database with a starter album and admin email:

```bash
# Using Docker
docker compose exec heron npm run seed:local

# Locally
cd heron && npm run seed:local
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js
- **Media**: S3-compatible storage
