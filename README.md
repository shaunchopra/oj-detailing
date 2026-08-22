# OJ Auto Detailing

Monorepo for the [OJ Auto Detailing](https://oj-auto-detailing.com.au) marketing site and quote-request API — Melbourne VIC.

| App | Package | Description |
| --- | --- | --- |
| **Web** | `@oj-detailing/web` | Astro static site served from S3 + CloudFront |
| **API** | `@oj-detailing/api` | Express API on AWS Lambda (API Gateway) — quote form emails via Resend |

**Production**

- Site: https://oj-auto-detailing.com.au
- API: https://api.oj-auto-detailing.com.au

**Staging (dev)**

- Site: https://dev.oj-auto-detailing.com.au
- API: https://api-dev.oj-auto-detailing.com.au

Push to the `dev` branch to deploy staging. Merge `dev` into `main` (or push to `main`) to deploy production.

## Prerequisites

- [pnpm](https://pnpm.io/) (see `packageManager` in root `package.json`)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials that can write to the S3 bucket and create CloudFront invalidations (for web deploy)
- [Serverless Framework](https://www.serverless.com/) account/login (for API deploy)

## Install

```sh
pnpm install
```

## Development

Run both apps in parallel:

```sh
pnpm dev
```

| App | URL | Notes |
| --- | --- | --- |
| Web | http://localhost:8080 | Astro dev server |
| API | http://localhost:3001 | Express dev server; quote endpoint at `/api/quote` |

The quote form on localhost posts to `http://localhost:3001/api/quote`. On staging it uses `https://api-dev.oj-auto-detailing.com.au/api/quote`. In production it uses `https://api.oj-auto-detailing.com.au/api/quote`.

Run a single app:

```sh
pnpm --filter @oj-detailing/web dev
pnpm --filter @oj-detailing/api dev
```

## Environment variables

### Web (`apps/web/.env`)

Used at **build time** to inject PostHog analytics into the site layout.

```sh
cp apps/web/.env.example apps/web/.env
```

| Variable | Description |
| --- | --- |
| `POSTHOG_PROJECT_TOKEN` | PostHog project API key (optional — analytics disabled if unset) |
| `POSTHOG_API_HOST` | PostHog ingest host (default `https://us.i.posthog.com`) |

### API (`apps/api/.env`)

Used for **local development** only. Lambda reads env vars from the Serverless deploy configuration.

Create `apps/api/.env` from the example file:

```sh
cp apps/api/.env.example apps/api/.env
```

| Variable | Description |
| --- | --- |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for sending quote emails (**required for deploy**) |
| `RESEND_FROM` | Sender address, e.g. `OJ Auto Detailing <quotes@oj-auto-detailing.com.au>` (**required for deploy**) |
| `CLOUDFRONT_ORIGIN` | Extra CORS origin (defaults to `https://oj-auto-detailing.com.au`) |
| `POSTHOG_API_KEY` | PostHog project API key for server-side events (optional) |
| `POSTHOG_HOST` | PostHog host (optional) |

## Build

```sh
pnpm build
```

Builds both apps. Web output goes to `apps/web/dist/`; API bundle goes to `apps/api/dist/`.

## Deploy

Deploy everything (API + web):

```sh
pnpm deploy
```

Dry run:

```sh
DRY_RUN=1 pnpm deploy
```

Or deploy individually with `pnpm deploy:api` / `pnpm deploy:web`.

### GitHub Actions

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) deploys from two branches:

| Branch | GitHub environment | Site | API |
| --- | --- | --- | --- |
| `dev` | `development` | https://dev.oj-auto-detailing.com.au | https://api-dev.oj-auto-detailing.com.au |
| `main` | `production` | https://oj-auto-detailing.com.au | https://api.oj-auto-detailing.com.au |

Typical flow: commit on `dev` → check staging → open a PR / merge into `main` to go live.

Add the same secrets on **both** environments (**Settings → Environments → production / development**):

| Secret | Required | Used by |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | yes | API + web |
| `AWS_SECRET_ACCESS_KEY` | yes | API + web |
| `SERVERLESS_ACCESS_KEY` | yes | API (Serverless Framework v4) |
| `RESEND_API_KEY` | yes | API |
| `RESEND_FROM` | yes | API |
| `POSTHOG_API_KEY` | no | API server-side events |
| `POSTHOG_HOST` | no | API (default unset) |
| `POSTHOG_PROJECT_TOKEN` | no | Web analytics at build time |
| `POSTHOG_API_HOST` | no | Web (defaults to `https://us.i.posthog.com`) |

The IAM user needs permission to deploy Lambda/API Gateway via Serverless (CloudFormation, Lambda, S3 deployment bucket, logs) plus S3/CloudFront access for both `oj-auto-detailing.com.au` (`ETRVB9UY704LE`) and `dev.oj-auto-detailing.com.au` (`EYBMHD6EPXUMX`). Create a [Serverless access key](https://app.serverless.com) for `SERVERLESS_ACCESS_KEY`.

### Web (S3 + CloudFront)

The static site deploys to S3 in `ap-southeast-2`, fronted by CloudFront. `STAGE=prod` (default) uses `oj-auto-detailing.com.au` / `ETRVB9UY704LE`. `STAGE=dev` uses `dev.oj-auto-detailing.com.au` / `EYBMHD6EPXUMX`.

```sh
pnpm deploy:web
STAGE=dev pnpm deploy:web
```

This builds the site (loading `apps/web/.env` if present), syncs `apps/web/dist/` to S3, and invalidates the CloudFront cache.

Dry run (no uploads):

```sh
DRY_RUN=1 pnpm deploy:web
```

Override defaults if needed:

```sh
S3_BUCKET=oj-auto-detailing.com.au \
CLOUDFRONT_DISTRIBUTION_ID=ETRVB9UY704LE \
AWS_REGION=ap-southeast-2 \
pnpm deploy:web
```

### API (AWS Lambda)

The quote API deploys to Lambda (`oj-detailing-api-prod-api`) in `ap-southeast-2` via the [Serverless Framework](https://www.serverless.com/). You need a Serverless account (`serverless login`) and AWS credentials configured.

```sh
cp apps/api/.env.example apps/api/.env
# fill in RESEND_API_KEY and RESEND_FROM

pnpm deploy:api
```

This loads `apps/api/.env`, builds the bundle, and runs `serverless deploy`.

Dry run (package only, no deploy):

```sh
DRY_RUN=1 pnpm deploy:api
```

Override stage or region:

```sh
STAGE=prod AWS_REGION=ap-southeast-2 pnpm deploy:api
STAGE=dev pnpm deploy:api
```

Remove the stack:

```sh
pnpm --filter @oj-detailing/api deploy:remove
```

## Project structure

```
apps/
  web/          Astro marketing site
  api/          Quote API (Express → Lambda)
scripts/
  deploy.sh      Deploy API + web
  deploy-web.sh  S3 + CloudFront deploy script
  deploy-api.sh  Lambda deploy script
apps/api/bruno/  API request collection (local + production)
```

## API testing

Import the Bruno collection from `apps/api/bruno/`. Switch environments to hit local (`localhost:3001`), staging (`api-dev.oj-auto-detailing.com.au`), or production (`api.oj-auto-detailing.com.au`).
