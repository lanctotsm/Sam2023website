#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
echo "Rebuilding and starting Docker (heron + MinIO)..."
docker compose -f docker-compose.dev.yml up --build -d
echo "Waiting for app at http://localhost:3000..."
until curl -sf http://localhost:3000 >/dev/null 2>&1; do sleep 2; done
cd heron && npm run test:e2e
