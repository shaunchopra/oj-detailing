#!/usr/bin/env bash
# Build the API bundle and deploy to AWS Lambda via Serverless Framework.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$ROOT/apps/api"
ENV_FILE="$API_DIR/.env"

AWS_REGION="${AWS_REGION:-ap-southeast-2}"
STAGE="${STAGE:-prod}"

if [[ "$STAGE" == "dev" ]]; then
  DEFAULT_ORIGIN="https://dev.oj-auto-detailing.com.au"
  API_URL="https://api-dev.oj-auto-detailing.com.au"
  CUSTOM_DOMAIN="api-dev.oj-auto-detailing.com.au"
else
  DEFAULT_ORIGIN="https://oj-auto-detailing.com.au"
  API_URL="https://api.oj-auto-detailing.com.au"
  CUSTOM_DOMAIN=""
fi

if [[ -f "$ENV_FILE" ]]; then
  eval "$(cd "$API_DIR" && DOTENV_CONFIG_PATH="$ENV_FILE" node -r dotenv/config -e "
    for (const key of ['RESEND_API_KEY', 'RESEND_FROM', 'CLOUDFRONT_ORIGIN', 'POSTHOG_API_KEY', 'POSTHOG_HOST', 'ALERT_EMAIL']) {
      const value = process.env[key];
      if (value) console.log('export ' + key + '=' + JSON.stringify(value));
    }
  ")"
fi

CLOUDFRONT_ORIGIN="${CLOUDFRONT_ORIGIN:-$DEFAULT_ORIGIN}"

missing=()
for var in RESEND_API_KEY RESEND_FROM ALERT_EMAIL; do
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

if [[ -n "$CUSTOM_DOMAIN" ]]; then
  echo "→ Ensuring custom domain mapping ($CUSTOM_DOMAIN)"
  HTTP_API_ID="$(pnpm exec serverless info --stage "$STAGE" --region "$AWS_REGION" --verbose 2>/dev/null \
    | awk -F': ' '/HttpApiId/ { print $2; exit }' || true)"
  if [[ -z "$HTTP_API_ID" ]]; then
    HTTP_API_ID="$(aws cloudformation describe-stack-resources \
      --stack-name "oj-detailing-api-${STAGE}" \
      --region "$AWS_REGION" \
      --query "StackResources[?ResourceType=='AWS::ApiGatewayV2::Api'].PhysicalResourceId" \
      --output text 2>/dev/null || true)"
  fi
  # serverless.yml pins the HTTP API id for known stages.
  if [[ -z "$HTTP_API_ID" || "$HTTP_API_ID" == "None" ]]; then
    if [[ "$STAGE" == "dev" ]]; then
      HTTP_API_ID="finqizix8b"
    fi
  fi

  if [[ -n "$HTTP_API_ID" && "$HTTP_API_ID" != "None" ]]; then
    DEFAULT_STAGE="$(aws apigatewayv2 get-stages \
      --api-id "$HTTP_API_ID" \
      --region "$AWS_REGION" \
      --query "Items[?StageName=='\$default'].StageName" \
      --output text 2>/dev/null || true)"
    if [[ -z "$DEFAULT_STAGE" || "$DEFAULT_STAGE" == "None" ]]; then
      aws apigatewayv2 create-stage \
        --api-id "$HTTP_API_ID" \
        --stage-name '$default' \
        --auto-deploy \
        --region "$AWS_REGION" >/dev/null
      echo "  Created \$default stage with auto-deploy"
    fi

    EXISTING_MAPPING="$(aws apigatewayv2 get-api-mappings \
      --domain-name "$CUSTOM_DOMAIN" \
      --region "$AWS_REGION" \
      --query "Items[?ApiId=='${HTTP_API_ID}'].ApiMappingId" \
      --output text 2>/dev/null || true)"
    if [[ -z "$EXISTING_MAPPING" || "$EXISTING_MAPPING" == "None" ]]; then
      aws apigatewayv2 create-api-mapping \
        --domain-name "$CUSTOM_DOMAIN" \
        --api-id "$HTTP_API_ID" \
        --stage '$default' \
        --region "$AWS_REGION" >/dev/null
      echo "  Mapped $CUSTOM_DOMAIN → $HTTP_API_ID (\$default)"
    else
      echo "  Mapping already exists"
    fi
  else
    echo "  Warning: could not resolve HTTP API id for domain mapping" >&2
  fi
fi

echo "✓ API deploy complete"
echo "  Endpoint: $API_URL"
