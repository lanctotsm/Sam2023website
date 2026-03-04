# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Heron CMS is a Next.js 15 (App Router) portfolio/blog CMS. The main application lives in `heron/`. It uses SQLite (embedded via `better-sqlite3`), Drizzle ORM, and S3-compatible storage (MinIO locally).

### Running services for local development (no-Docker path)

1. **MinIO** (S3 storage): `sudo docker compose -f docker-compose.dev.yml up -d minio minio-init` from repo root. Ports 9000 (API) and 9001 (console). Console login: `minioadmin`/`minioadmin`.
2. **Next.js dev server**: `npm run dev` from `heron/`. Runs on port 3000.
3. **Database init** (first time only): from `heron/`, run `npx tsx -e "import { getDb } from './lib/db/index.ts'; getDb(); console.log('db ready');"` then `npm run seed:local`.

### Environment files

- Copy `heron/.env.local.example` to `heron/.env.local`. Default values work for local dev with MinIO.
- `DEV_AUTH_BYPASS=true` enables a "Dev Login" button at `/admin` (no Google OAuth needed).
- `BASE_ADMIN_EMAIL=dev@local` is the seeded admin account.

### Key commands (all from `heron/`)

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| Unit tests (Vitest) | `npm run test` |
| E2E tests (Playwright) | `npm run test:e2e` (requires app + MinIO running) |
| Seed DB | `npm run seed:local` |

### Gotchas

- `npm run typecheck` has pre-existing errors in `lib/shortcodes.tsx` and `app/posts/[slug]/page.tsx`. These are in the repo's current state and not caused by setup.
- Docker is required even in the no-Docker dev path because MinIO runs as a container. The Docker daemon must be started with `sudo dockerd` if it isn't already running.
- The `.cursorrules` file references Windows commands, but the Cloud Agent environment is Linux. Ignore the Windows-specific guidance and use standard Unix commands.
- `better-sqlite3` is a native addon; run `npm rebuild better-sqlite3` if you switch Node versions.
- The SQLite DB file defaults to `./data/cms.db` relative to `heron/`. It is auto-created on first access.
