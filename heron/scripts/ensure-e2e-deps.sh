#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
HERON_DIR="$ROOT_DIR/heron"

echo "Ensuring E2E dependencies..."

# Local SQLite DB is file-based. Ensure folder and file exist.
DB_PATH="${CMS_DB_PATH:-$HERON_DIR/data/cms.db}"
mkdir -p "$(dirname "$DB_PATH")"
if [ ! -f "$DB_PATH" ]; then
  touch "$DB_PATH"
  echo "Created local DB file at: $DB_PATH"
else
  echo "Local DB file present: $DB_PATH"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run MinIO for E2E tests." >&2
  exit 1
fi

echo "Starting/checking app + dependency services via docker compose..."
cd "$ROOT_DIR"
docker compose -f docker-compose.dev.yml up -d minio minio-init heron

echo "Waiting for MinIO health endpoint..."
for i in {1..60}; do
  if curl -sf "http://localhost:9000/minio/health/live" >/dev/null 2>&1; then
    echo "MinIO is healthy."
    break
  fi
  sleep 2
done

if ! curl -sf "http://localhost:9000/minio/health/live" >/dev/null 2>&1; then
  echo "Timed out waiting for MinIO to become healthy." >&2
  exit 1
fi

echo "Waiting for app endpoint at http://localhost:3000..."
for i in {1..90}; do
  if curl -s "http://localhost:3000" >/dev/null 2>&1; then
    echo "App is responding on localhost:3000."
    exit 0
  fi
  sleep 2
done

echo "Timed out waiting for app to respond on localhost:3000." >&2
exit 1
