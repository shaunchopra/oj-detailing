#!/usr/bin/env bash
# Deploy API (Lambda) and web (S3 + CloudFront).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploying API ==="
bash "$ROOT/scripts/deploy-api.sh"

echo
echo "=== Deploying web ==="
bash "$ROOT/scripts/deploy-web.sh"

echo
echo "✓ Full deploy complete"
