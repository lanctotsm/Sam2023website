#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
echo "Rebuilding and starting Docker (heron + MinIO)..."
docker compose -f docker-compose.dev.yml up --build -d
echo "Waiting for app at http://localhost:3000..."
for i in $(seq 1 90); do
  if curl -sf http://localhost:3000 >/dev/null 2>&1; then
    echo "App is up."
    break
  fi
  if [ "$i" -eq 90 ]; then
    echo "Timed out waiting for app on localhost:3000." >&2
    docker compose -f docker-compose.dev.yml logs --tail=50 heron >&2 || true
    exit 1
  fi
  sleep 2
done
cd heron && npm run test:e2e
