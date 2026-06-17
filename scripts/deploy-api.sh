#!/usr/bin/env bash
# Build the API bundle and deploy to AWS Lambda via Serverless Framework.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT/apps/api"
ENV_FILE="$API_DIR/.env"

AWS_REGION="${AWS_REGION:-ap-southeast-2}"
STAGE="${STAGE:-prod}"

if [[ -f "$ENV_FILE" ]]; then
  eval "$(cd "$API_DIR" && DOTENV_CONFIG_PATH="$ENV_FILE" node -r dotenv/config -e "
    for (const key of ['RESEND_API_KEY', 'RESEND_FROM', 'CLOUDFRONT_ORIGIN', 'POSTHOG_API_KEY', 'POSTHOG_HOST']) {
      const value = process.env[key];
      if (value) console.log('export ' + key + '=' + JSON.stringify(value));
    }
  ")"
fi

CLOUDFRONT_ORIGIN="${CLOUDFRONT_ORIGIN:-https://oj-auto-detailing.com.au}"

missing=()
for var in RESEND_API_KEY RESEND_FROM; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing required env vars: ${missing[*]}" >&2
  echo "Copy apps/api/.env.example to apps/api/.env and fill in values." >&2
  exit 1
fi

export CLOUDFRONT_ORIGIN

echo "→ Building API bundle"
pnpm --filter @oj-detailing/api build

if [[ ! -f "$API_DIR/dist/lambda.js" ]]; then
  echo "Build output not found at $API_DIR/dist/lambda.js" >&2
  exit 1
fi

cd "$API_DIR"

if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "→ Dry run: packaging Lambda (no deploy)"
  pnpm exec serverless package --stage "$STAGE" --region "$AWS_REGION"
  echo "✓ Package created — nothing deployed"
  exit 0
fi

echo "→ Deploying to AWS Lambda (stage: $STAGE, region: $AWS_REGION)"
pnpm exec serverless deploy --stage "$STAGE" --region "$AWS_REGION"

echo "✓ API deploy complete"
echo "  Endpoint: https://api.oj-auto-detailing.com.au"
