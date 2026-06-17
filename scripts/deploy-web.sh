#!/usr/bin/env bash
# Build the static site and deploy to S3 + CloudFront invalidation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/apps/web/dist"
ENV_FILE="$ROOT/apps/web/.env"

# Override via environment if needed
S3_BUCKET="${S3_BUCKET:-oj-auto-detailing.com.au}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-ETRVB9UY704LE}"

echo "→ Building static site"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi
pnpm --filter @oj-detailing/web build

if [[ ! -d "$DIST" ]]; then
  echo "Build output not found at $DIST" >&2
  exit 1
fi

S3_URI="s3://${S3_BUCKET}/"

if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "→ Dry run: would sync to $S3_URI"
  aws s3 sync "$DIST" "$S3_URI" --delete --region "$AWS_REGION" --dryrun
  echo "→ Dry run: would invalidate CloudFront distribution $CLOUDFRONT_DISTRIBUTION_ID"
  exit 0
fi

echo "→ Syncing assets to $S3_URI"
aws s3 sync "$DIST" "$S3_URI" \
  --delete \
  --region "$AWS_REGION" \
  --exclude "index.html" \
  --exclude "terms.html" \
  --cache-control "public, max-age=31536000"

aws s3 sync "$DIST" "$S3_URI" \
  --region "$AWS_REGION" \
  --exclude "*" \
  --include "index.html" \
  --include "terms.html" \
  --cache-control "public, max-age=0, must-revalidate"

echo "→ Invalidating CloudFront cache ($CLOUDFRONT_DISTRIBUTION_ID)"
INVALIDATION_ID="$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)"

echo "✓ Deploy complete"
echo "  Site:    https://oj-auto-detailing.com.au"
echo "  Invalidation: $INVALIDATION_ID (usually live within a few minutes)"
