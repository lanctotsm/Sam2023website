# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Heron CMS is a Next.js 15 (App Router) portfolio/blog CMS. All application code lives in `heron/`.
It uses SQLite (embedded via the native `better-sqlite3`), Drizzle ORM, and S3-compatible object
storage (MinIO locally) for media. Standard scripts are defined in `heron/package.json`; general
setup is documented in the root `README.md`.

### Node version (important)

- The app requires **Node.js 24** (native `better-sqlite3` / `sharp` are built for the active Node
  ABI, and CI uses Node 24). The startup update script installs and selects Node 24 via `nvm`, and
  `nvm alias default 24` is set so interactive shells (which source `nvm` from `~/.bashrc`) get
  Node 24 automatically.
- Gotcha: a fixed `/exec-daemon/node` (Node 22) can shadow `nvm` in shells that do not source
  `~/.bashrc`. If `node -v` shows v22, run `nvm use 24` (or start a fresh login shell) before
  running `npm`/`node`. If you ever switch Node versions, rebuild the native addons:
  `npm --prefix heron rebuild better-sqlite3 sharp` (or re-run `npm ci`).

### Key commands (run from `heron/`)

See `heron/package.json` for the full list. Common ones: `npm run dev`, `npm run lint`,
`npm run typecheck`, `npm test` (Vitest), `npm run build`, `npm run seed:local`.
`npm test` currently passes fully; `npm run lint` reports 0 errors (a few warnings) and
`npm run typecheck` is clean.

### Environment file

- Copy `heron/.env.local.example` to `heron/.env.local` (the update script does this if missing).
  The default values work for local dev against the local MinIO instance below.
- `DEV_AUTH_BYPASS=true` enables a one-click **Dev Login** button at `/admin` — no Google OAuth
  needed. It logs in as `BASE_ADMIN_EMAIL` (`dev@local`), which `npm run seed:local` provisions as
  an admin.

### Running services (not started by the update script)

Docker is **not** installed in this environment, so `docker-compose.dev.yml` is not used. Run the
two services directly instead:

1. **MinIO (S3 storage)** — standalone binaries are pre-installed at `~/.local/bin/minio` and
   `~/.local/bin/mc`. Start the server (ports 9000 API / 9001 console, creds `minioadmin`/`minioadmin`):
   ```bash
   MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin \
     ~/.local/bin/minio server ~/minio-data --address ":9000" --console-address ":9001"
   ```
   First-time only, create the bucket and make it publicly readable (matches `docker-compose.dev.yml`):
   ```bash
   ~/.local/bin/mc alias set local http://localhost:9000 minioadmin minioadmin
   ~/.local/bin/mc mb -p local/cms
   ~/.local/bin/mc anonymous set download local/cms
   ```
2. **Next.js dev server** — from `heron/`: `npm run dev` (http://localhost:3000). Seed the DB once
   with `npm run seed:local` before first use.

Media upload/serving requires MinIO running; post/album text content only needs SQLite. Long-lived
processes are best run under `tmux` so they survive between commands.

### Other notes

- The SQLite DB defaults to `heron/data/cms.db` and is auto-created on first access.
- The root `.cursorrules` describes a Windows/PowerShell workflow — ignore it here; this environment
  is Linux, use standard Unix commands.
