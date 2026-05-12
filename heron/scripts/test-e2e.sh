#!/usr/bin/env bash
set -euo pipefail

HERON_DIR="$(cd "$(dirname "$0")/.." && pwd)"

bash "$HERON_DIR/scripts/ensure-e2e-deps.sh"

cd "$HERON_DIR"
npx playwright test "$@"
