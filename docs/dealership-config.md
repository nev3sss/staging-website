# NEV3S Dealership — Configuration Reference

| Key | Value | Where set |
|---|---|---|
| `DEALER_APPLICATION_ENABLED` | `true` | Worker KV `feature_flags` namespace |
| `MAX_PRIVATE_SELLER_ACTIVE_LISTINGS` | `5` | Worker KV `feature_flags` |
| `APPLICATION_REVIEW_WINDOW_DAYS` | `3` | Worker KV `feature_flags` |
| `DEALER_DOCS_BUCKET` | `nev3s-dealership-docs` (binding: `DEALER_DOCS`) | `workers/wrangler.toml` |
| `LISTING_MEDIA_BUCKET` | `nev3s-marketplace-media` (binding: `LISTING_MEDIA`) | `workers/wrangler.toml` |
| `EMAIL_API_KEY` | (Resend or Postmark key) | `wrangler secret put` |
| `EMAIL_FROM_ADDRESS` | `dealer-notify@nev3s.com` | Worker KV `config` |
| `EMAIL_FROM_NAME` | `NEV3S Dealer Team` | Worker KV `config` |
| `TURNSTILE_SITE_KEY` | `<from Cloudflare dashboard>` | Frontend `scripts/dealers/config.js` (public) |
| `TURNSTILE_SECRET_KEY` | `<from Cloudflare dashboard>` | `wrangler secret put TURNSTILE_SECRET` |
| `LAUNCH_WINDOW_END_DATE` | `2027-03-31` | Worker KV `config` |
| `LAUNCH_CAROUSEL_MAX_DEALERS` | `50` | Worker KV `config` |

> **Note:** This is a reference document only. Actual runtime values are stored in Cloudflare KV `config` and `feature_flags` namespaces, plus Worker secrets. The `staging-website` static site itself has no `.env` file — only the Worker has secrets.

## Worker Secrets — How to Set

```bash
# For local development
cp workers/.dev.vars.example workers/.dev.vars
# edit .dev.vars with real values, then run:
cd workers && npx wrangler dev

# For production deploy
cd workers
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_API_TOKEN
npx wrangler secret put JWT_SECRET
```
