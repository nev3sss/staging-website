# Cloudflare Worker Setup — NEV3S Dealership API

## Live URL

```
https://nev3s-dealership-api.nev3s-dev.workers.dev
```

## Prerequisites (one-time GitHub setup)

Before the CI/CD workflow can deploy, two values must be configured in the
GitHub repository settings at https://github.com/nev3sss/staging-website/settings:

**Secret (Settings → Secrets and variables → Actions → New repository secret):**

- `CLOUDFLARE_API_TOKEN` — value: `cfut_...` (your Cloudflare API token)

**Variable (Settings → Secrets and variables → Actions → Variables → New repository variable):**

- `CLOUDFLARE_ACCOUNT_ID` — value: your Cloudflare account ID (found in the Cloudflare dashboard URL or `wrangler whoami` output)

## Resource IDs (not secrets — safe to commit)

| Resource           | Binding in Worker | Value                                                             |
| ------------------ | ----------------- | ----------------------------------------------------------------- |
| D1 database        | `DB`              | `nev3s-dealership-db` / ID `9c191f9f-f450-463d-a42f-7875610e0e04` |
| R2 (private docs)  | `DEALER_DOCS`     | `nev3s-dealership-docs`                                           |
| R2 (public media)  | `LISTING_MEDIA`   | `nev3s-marketplace-media`                                         |
| KV (feature flags) | `FEATURE_FLAGS`   | ID `085e663fe176408eb98511b93c7daf92`                             |
| KV (config)        | `CONFIG`          | ID `e147a338252345f6a331324abe88405a`                             |

## Secrets (set via `wrangler secret put`)

| Secret                 | Set command                                | Notes                                      |
| ---------------------- | ------------------------------------------ | ------------------------------------------ |
| `TURNSTILE_SECRET_KEY` | `wrangler secret put TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret from dashboard |
| `RESEND_API_KEY`       | `wrangler secret put RESEND_API_KEY`       | Resend API key                             |
| `JWT_SECRET`           | `wrangler secret put JWT_SECRET`           | Random string (min 32 chars)               |
| `ADMIN_API_TOKEN`      | `wrangler secret put ADMIN_API_TOKEN`      | Random token for admin endpoints           |
| `EMAIL_API_KEY`        | `wrangler secret put EMAIL_API_KEY`        | Same as RESEND_API_KEY                     |

## Local Development

```powershell
cd workers
# Copy and edit local secrets
cp .dev.vars.example .dev.vars
# edit .dev.vars with your values

# Run locally
npx wrangler dev
# Open http://localhost:8787/api/v1/health
```

## Deploy (manual)

```powershell
cd workers
npx wrangler deploy
```

## CI/CD (automatic on push to `main`)

1. Push to `main` → Worker auto-deploys to production (top-level env)
2. `workflow_dispatch` → choose `staging` to deploy to the `env.staging` environment

**Never trigger D1 migrations on every push.** Migrations are run manually via `workflow_dispatch` with `env=production`.

## Test

```bash
# Health check
curl https://nev3s-dealership-api.nev3s-dev.workers.dev/api/v1/health

# CORS preflight
curl -X OPTIONS https://nev3s-dealership-api.nev3s-dev.workers.dev/api/v1/health \
  -H "Origin: https://www.nev3s.com" -I

# View live logs
wrangler tail
```

## API Endpoints

| Method | Path                             | Auth               | Description                                                              |
| ------ | -------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| GET    | `/api/v1/health`                 | None               | Health check                                                             |
| POST   | `/api/v1/dealer-applications`    | Turnstile          | Submit dealer application                                                |
| GET    | `/api/v1/dealer-applications/me` | Bearer JWT         | Get own application (Phase 2)                                            |
| POST   | `/api/v1/documents/upload`       | Bearer JWT         | Upload document to R2                                                    |
| POST   | `/api/v1/documents/presign`      | Bearer JWT         | Not implemented (501); presigned uploads disabled -- use upload endpoint |
| GET    | `/api/v1/documents/:key`         | Bearer JWT         | Stream document body from R2                                             |
| DELETE | `/api/v1/documents/:key`         | Bearer JWT         | Delete document                                                          |
| GET    | `/api/v1/admin/applications`     | Bearer JWT (admin) | List all applications                                                    |
| PATCH  | `/api/v1/admin/applications/:id` | Bearer JWT (admin) | Approve/reject                                                           |
| GET    | `/api/v1/admin/analytics`        | Bearer JWT (admin) | Analytics                                                                |
| POST   | `/api/v1/enquiries`              | Turnstile          | Buyer enquiry                                                            |

## File Map

```
workers/
  wrangler.toml          — Worker config (committed; no secrets)
  .dev.vars              — Local secrets (gitignored; never commit)
  .dev.vars.example      — Template without secrets (committed)
  package.json
  tsconfig.json
  migrations/
    0001_initial_schema.sql
  src/
    index.ts             — Entry point, route dispatch, cron triggers
    lib/
      responses.ts       — CORS headers, JSON helpers
      turnstile.ts       — Token verification
      ids.ts             — UUID-based ID generation
      cron.ts            — Scheduled task handlers
      email.ts           — Email templates
    routes/
      dealer-applications.ts
      enquiries.ts
      documents.ts
      admin.ts
      types.ts
```
