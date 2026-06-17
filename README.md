# OJ Auto Detailing

Monorepo for the [OJ Auto Detailing](https://oj-auto-detailing.com.au) marketing site and quote-request API — Melbourne VIC.

| App | Package | Description |
| --- | --- | --- |
| **Web** | `@oj-detailing/web` | Static site (HTML/CSS/JS) served from S3 + CloudFront |
| **API** | `@oj-detailing/api` | Express API on AWS Lambda (API Gateway) — quote form emails via Resend |

**Production**

- Site: https://oj-auto-detailing.com.au
- API: https://api.oj-auto-detailing.com.au

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
| Web | http://localhost:8080 | Static files via `serve` |
| API | http://localhost:3001 | Express dev server; quote endpoint at `/api/quote` |

The quote form on localhost posts to `http://localhost:3001/api/quote`. In production it uses `https://api.oj-auto-detailing.com.au/api/quote`.

Run a single app:

```sh
pnpm --filter @oj-detailing/web dev
pnpm --filter @oj-detailing/api dev
```

## Environment variables

### Web (`apps/web/.env`)

Used at **build time** to inject PostHog analytics into `index.html` and `terms.html`.

```sh
cp apps/web/.env.example apps/web/.env
```

| Variable | Description |
| --- | --- |
| `POSTHOG_PROJECT_TOKEN` | PostHog project API key (optional — analytics disabled if unset) |
| `POSTHOG_API_HOST` | PostHog ingest host (default `https://us.i.posthog.com`) |

### API (`apps/api/.env`)

Used for **local development** only. Lambda reads env vars from the Serverless deploy configuration.

Create `apps/api/.env` with:

| Variable | Description |
| --- | --- |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key for sending quote emails |
| `RESEND_FROM` | Sender address, e.g. `OJ Auto Detailing <quotes@oj-auto-detailing.com.au>` |
| `CLOUDFRONT_ORIGIN` | Allowed CORS origin, e.g. `https://oj-auto-detailing.com.au` |
| `POSTHOG_API_KEY` | PostHog project API key for server-side events (optional) |
| `POSTHOG_HOST` | PostHog host (optional) |

## Build

```sh
pnpm build
```

Builds both apps. Web output goes to `apps/web/dist/`; API bundle goes to `apps/api/dist/`.

## Deploy

### Web (S3 + CloudFront)

The static site deploys to the `oj-auto-detailing.com.au` S3 bucket in `ap-southeast-2`, fronted by CloudFront distribution `ETRVB9UY704LE`.

```sh
pnpm deploy:web
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

Export secrets, build, then deploy with Serverless:

```sh
export RESEND_API_KEY=re_...
export RESEND_FROM="OJ Auto Detailing <quotes@oj-auto-detailing.com.au>"
export CLOUDFRONT_ORIGIN=https://oj-auto-detailing.com.au

pnpm --filter @oj-detailing/api build
pnpm --filter @oj-detailing/api deploy
```

Remove the stack:

```sh
pnpm --filter @oj-detailing/api deploy:remove
```

## Project structure

```
apps/
  web/          Static marketing site
  api/          Quote API (Express → Lambda)
scripts/
  deploy-web.sh S3 + CloudFront deploy script
apps/api/bruno/  API request collection (local + production)
```

## API testing

Import the Bruno collection from `apps/api/bruno/`. Switch environments to hit local dev (`localhost:3001`) or production (`api.oj-auto-detailing.com.au`).
