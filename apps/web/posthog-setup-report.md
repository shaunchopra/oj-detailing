# PostHog post-wizard report

The wizard has completed a server-side PostHog integration for the OJ Auto Detailing API (`apps/api`). A PostHog singleton (`posthog-node`) was wired into the Express app with serverless-safe settings (`flushAt: 1`, `flushInterval: 0`), and capture calls were added to the quote route and service layer. Exception tracking was also added to the global error handler. The existing client-side integration (`apps/web/js/posthog-init.js`) and its `quote_submitted` event were left untouched.

| Event | Description | File |
|---|---|---|
| `quote_received` | Server confirms a valid quote request passed validation and was accepted for processing | `apps/api/src/routes/quote.ts` |
| `quote_email_sent` | Quote email successfully delivered via Resend | `apps/api/src/services/quote.ts` |
| `quote_email_failed` | Quote email failed to send; flags a delivery issue requiring follow-up | `apps/api/src/services/quote.ts` |

## Next steps

A dashboard and five insights have been created in PostHog:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/474492/dashboard/1725005)
- [Quote requests over time](https://us.posthog.com/project/474492/insights/jFfbJFLu)
- [Email delivery: sent vs failed](https://us.posthog.com/project/474492/insights/lik0R6tQ)
- [Quote requests by vehicle type](https://us.posthog.com/project/474492/insights/OzwxGXVK)
- [Quote requests by service tier](https://us.posthog.com/project/474492/insights/7yS8GXuf)
- [Email delivery rate](https://us.posthog.com/project/474492/insights/PlaPbDdS)

## Verify before merging

- [ ] Run `pnpm install` from the monorepo root (`/Users/shaunchopra/Desktop/oj-detailing`) to install `posthog-node` — the wizard added it to `apps/api/package.json` but could not run the install due to sandbox restrictions.
- [ ] Run a full production build (`pnpm build --filter @oj-detailing/api`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_API_KEY` and `POSTHOG_HOST` to `apps/api/.env.example` (and any serverless deploy configuration such as `serverless.yml` environment variables) so collaborators and the Lambda runtime know what to set.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
