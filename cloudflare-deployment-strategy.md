# Cloudflare Deployment Strategy — Next.js 14 EV Marketplace for GCC

**Date:** September 2026  
**Project:** AI-powered EV marketplace for GCC region  
**Existing infra:** nev3s.com on Cloudflare Free plan, experience with Pages/Workers/D1/R2

---

## 1. Deployment Platform: Cloudflare Workers + OpenNext (RECOMMENDED)

### Pages vs Workers

| Factor                     | Cloudflare Pages + `next-on-pages` | Cloudflare Workers + `@opennextjs/cloudflare`               |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| Runtime                    | Edge runtime only                  | **Node.js runtime** (full Node.js compat via workerd)       |
| Next.js 14 support         | Partial (edge-constrained APIs)    | **Full** — App Router, SSR, ISR, Middleware, Route Handlers |
| Server Actions             | Limited                            | **Supported**                                               |
| ISR                        | Not supported                      | **Supported** (KV-backed tag cache + revalidation queue)    |
| PPR (Partial Prerendering) | Not supported                      | **Supported**                                               |
| Image optimization         | Manual config                      | **Supported** (via Cloudflare Images binding)               |
| Status                     | **Legacy** — maintenance mode      | **Active** — cloudflare-endorsed, recommended path          |

**Recommendation: Workers + OpenNext.** `@cloudflare/next-on-pages` is the legacy route and only supports the constrained Edge runtime. `@opennextjs/cloudflare` uses the Node.js runtime with full Next.js feature parity. Cloudflare published an official blog post (Aug 2025) announcing this as the recommended deployment path.

### Setup

```bash
# New project
npm create cloudflare@latest -- my-next-app --framework=next --platform=workers

# Existing project
npm install @opennextjs/cloudflare
# update next.config.ts with OpenNext wrapper
```

### Worker Size Limits

- Worker bundle: 10MB (Free), 25MB (Paid). Large Next.js apps may hit this.
- Mitigation: OpenNext splits into multiple workers (skew protection, multi-worker setup).

---

## 2. Edge Caching for RTL/i18n Content

### Strategy

GCC markets require Arabic (RTL) + English (LTR) with locale detection.

**Approach: URL-path-based locale + cookie fallback**

```
/ar/listings  → Arabic (RTL)
/en/listings  → English (LTR)
/ redirects → auto-detect via Accept-Language → redirect to /ar or /en
```

**Caching considerations:**

1. **Vary: Accept-Language is wrong.** Cloudflare CDN caches by URL. If you rely on `Accept-Language` header variation, the CDN can't efficiently cache (too many cache variants). Instead, use URL-based routing (`/ar/...`, `/en/...`). One cache key per URL — far more efficient.

2. **Middleware runs at the edge on Workers.** Locale detection (redirect from `/` to `/ar` or `/en`) happens in Next.js middleware, which runs inside the Worker. This is fast and happens before CDN cache lookup. The middleware sets a `NEXT_LOCALE` cookie so returning users see their preferred language.

3. **RTL CSS:** The RTL stylesheet is a static asset. Serve it with long cache TTL (`Cache-Control: public, max-age=31536000, immutable`). Cloudflare automatically caches static assets at edge.

4. **i18n content (listings, dealer pages):** Use ISR with time-based revalidation. Arabic and English pages are separate URLs, each cached independently at the edge. Cloudflare Workers KV stores the ISR cache tags.

**Library:** `next-intl` (recommended over next-i18next for App Router) — supports RTL, locale detection, cookie persistence, and URL-based routing out of the box.

---

## 3. ISR Compatibility

### On Cloudflare Workers with OpenNext

✅ **Fully supported** as of OpenNext v1.0.0-beta (2025).

**How it works:**

- ISR/SSG pages are cached in Cloudflare Workers KV
- OpenNext provides a **tag cache** system — tag cached pages and revalidate on-demand
- **Time-based revalidation:** `revalidate: 3600` works as expected
- **On-demand revalidation:** `revalidateTag()` and `revalidatePath()` trigger background regeneration
- **Revalidation queue:** OpenNext includes a queue system that processes revalidation requests without blocking user requests
- **Cache interception:** Optionally intercept cached responses before loading the full NextServer, improving cold starts

**For the EV marketplace, ISR is ideal for:**

- EV listing pages (revalidate every 5-15 minutes as inventory changes)
- Dealer profile pages (revalidate daily or on-demand when dealer updates profile)
- Static marketing pages (revalidate weekly)
- Search results (SSR — not ISR, since they're query-dependent)

**Caveat:** ISR on Workers uses KV, which is eventually consistent (propagation < 60s in most regions). If you need immediate consistency for financial/transactional data, use SSR for those pages.

---

## 4. DDoS Protection for Marketplace Traffic

### Cloudflare Built-in (All Plans, including Free)

Cloudflare provides DDoS protection on **every plan** with no additional cost:

- **Layer 3/4 DDoS:** Always-on, unmetered mitigation. Automatically detects and blocks volumetric attacks (SYN floods, UDP floods, DNS amplification).
- **Layer 7 DDoS:** HTTP DDoS protection via WAF. Free plan includes the managed ruleset.
- **"I'm Under Attack" mode:** One-click toggle that presents JS challenge to all visitors — useful during active attacks.
- **Bot Fight Mode:** Free plan includes basic bot detection. Pro plan adds "Super Bot Fight Mode" for more granular control.

### Pro Plan ($20/mo) Upgrades Worth Considering

For a marketplace handling financial transactions and lead data:

- **20 Custom WAF rules** (Free: 5) — allows more granular blocking
- **Rate Limiting rules** (Free: none dedicated; must use WAF custom rules) — dedicated RL rules with better analytics
- **Bot Management** (add-on) — ML-based bot scoring
- **Polish/Mirage** — image optimization

### GCC-Specific DDoS Landscape

H1 2026 saw a **519% surge** in hyper-volumetric DDoS attacks globally. GCC e-commerce and marketplace platforms are regular targets. Cloudflare's largest-ever mitigated attack was 3.8 Tbps. The Free plan's unmetered DDoS protection alone justifies Cloudflare.

---

## 5. Image Optimization

### Recommendation: Cloudflare Images (not Images.com)

**Cloudflare Images** is the clear winner for this stack:

| Factor          | Cloudflare Images                                   | Images.com                     |
| --------------- | --------------------------------------------------- | ------------------------------ |
| Integration     | Native Workers binding, single dashboard            | External CDN, separate billing |
| Pricing (Free)  | 5,000 stored images + 5,000 unique transforms/month | N/A — not a Cloudflare product |
| Paid transforms | $0.50/1,000 unique transformations                  | Unknown/comparison unavailable |
| Storage         | $5/100K images/month                                | —                              |
| Delivery        | Served from same 330+ edge network                  | Separate CDN                   |
| Formats         | Auto WebP/AVIF conversion                           | —                              |
| RTL-aware       | Same CDN, no extra config                           | —                              |

**Image optimization strategy for the EV marketplace:**

1. **Cloudflare Images** as the image backend — stores and serves all listing photos, dealer logos, battery certification documents
2. **OpenNext image loader** — Next.js `<Image>` component routes through Cloudflare Images for automatic resizing, format conversion (WebP/AVIF), and caching
3. **Remote transformations** — dynamic URL-based resizing: `https://images.nev3s.com/cdn-cgi/image/width=400,quality=80/https://...` (available on Pro plan and above; Free plan has limited transforms)
4. **Predefined variants** — create `thumbnail` (100×100), `card` (400×300), `hero` (1200×600) variants for consistent sizing

**Cost estimate for 10K EV listings with avg 8 photos each:**

- 80,000 images stored: $0 (under 100K threshold) or $5
- Each listing viewed in 3 sizes: 240K transformations/month
- First 5,000 unique transforms free, then 235K × $0.50/1K = $117.50 → likely under Free tier limits for early growth, but budget ~$120/mo at scale

**Alternative: Cloudflare Image Resizing (Pro plan):** Pay $0.50/1K unique transformations without storing images — use R2 for storage ($0.015/GB). Cheaper at high volumes.

---

## 6. Domain Setup

### Recommendation: Subdomain on nev3s.com

**Use a subdomain:** `ev.nev3s.com` or `marketplace.nev3s.com`

**Rationale:**

- **SEO clarity:** nev3s.com is the corporate/landing site. The marketplace gets its own subdomain for clear separation
- **Shared Cloudflare config:** Same zone, same WAF rules, same SSL certificate — simpler management
- **Existing trust:** nev3s.com already has domain authority; a subdomain inherits some of this
- **Cost:** No additional domain registration or zone
- **Deployment independence:** Pages/Workers deployments can target different subdomains from the main site

**Alternative (new domain):** Only worth it if you want an entirely separate brand identity (e.g., `evmarketplace.ae`). Adds DNS management overhead and requires building domain authority from scratch.

**Cloudflare configuration per subdomain:**

- DNS: CNAME `marketplace.nev3s.com` → Workers dev or Pages deployment
- SSL: Automatic (Full or Full Strict mode)
- WAF: Same zone-level rules protect all subdomains

---

## 7. Cloudflare Workers for API BFF (Backend-for-Frontend) Layer

### Architecture

```
Browser ──→ Cloudflare Workers (Next.js SSR/ISR/API)
                │
                ├── D1 (SQLite) — session data, rate limiting counters
                ├── R2 — uploaded images, documents
                ├── KV — ISR cache, feature flags, config
                ├── Queue — async jobs (email, notifications, revalidation)
                └── External APIs (battery certification, charging station data, AI search)
```

### BFF Pattern on Workers

Next.js already acts as a BFF via:

- **Server Components** — fetch data server-side, render HTML
- **Route Handlers** (`route.ts`) — API endpoints that aggregate data from multiple sources
- **Server Actions** — form submissions, lead generation, dealer signup

**Why this beats a separate BFF:**

- Co-located with frontend code — no cross-repo coordination
- Same Worker handles SSR, ISR, and API routes — no cold start penalty
- TypeScript types shared between client and server
- Single deployment pipeline

### API Routes for the EV Marketplace

| Route                    | Purpose                | Data Source                            |
| ------------------------ | ---------------------- | -------------------------------------- |
| `/api/listings`          | EV listing CRUD        | Supabase/Neon Postgres                 |
| `/api/dealers`           | Dealer management      | Postgres                               |
| `/api/charging-stations` | Map + station data     | Postgres + external API                |
| `/api/battery-cert`      | Certification workflow | Postgres + R2 (documents)              |
| `/api/leads`             | Lead form submissions  | Postgres + Queue (notify dealer)       |
| `/api/search`            | AI-powered search      | Postgres (pgvector) or external AI API |
| `/api/recommendations`   | AI recommendations     | Postgres + ML service                  |

All of these run inside the same Worker deployment as the Next.js app, sharing bindings.

---

## 8. Rate Limiting for Lead Forms

### Free Plan Approach (5 WAF Custom Rules)

Even on Free, you can implement robust rate limiting:

1. **WAF Custom Rule — Rate Limit by IP:**

   ```
   (http.request.uri.path matches "/api/leads" and http.request.method eq "POST")
   ```

   Action: Block after N requests per time window (use rate-limit function in WAF)

2. **Turnstile (Free):** Add Cloudflare Turnstile (invisible CAPTCHA) to all lead forms. Server-side validation via Turnstile API before accepting the lead.

3. **Origin-level rate limiting in D1:** Track submissions per IP in D1 table:

   ```sql
   CREATE TABLE lead_rate_limits (
     ip TEXT PRIMARY KEY,
     count INTEGER DEFAULT 1,
     window_start INTEGER
   );
   ```

   Enforce 5 leads/hour/IP. Check + increment on each submission. Zero additional cost.

4. **Honeypot field:** Hidden form field that bots fill; reject submissions with it filled.

### Pro Plan ($20/mo) Adds:

- 2 dedicated Rate Limiting rules with analytics dashboard
- Response header injection (rate-limit status for client UX)
- More granular rules: rate limit by path + IP + user-agent

### Recommendation

Start with Free plan (Turnstile + D1 IP tracking + WAF custom rule). Upgrade to Pro when lead volume or attack frequency justifies it.

---

## 9. Analytics — Cloudflare Web Analytics

### Why Cloudflare Web Analytics (over Google Analytics)

| Factor           | Cloudflare Web Analytics                              | Google Analytics 4                       |
| ---------------- | ----------------------------------------------------- | ---------------------------------------- |
| Privacy          | Cookie-free, no consent banner needed                 | Cookies required, GDPR consent mandatory |
| Cost             | **Free** (even on Free plan)                          | Free (but you pay with data)             |
| Real-time        | Yes                                                   | Limited (24-48hr delay on free)          |
| Performance      | Zero client-side JS (edge-collected)                  | ~45KB gtag.js + network requests         |
| Data ownership   | You own it, Cloudflare doesn't sell it                | Google mines it                          |
| GCC privacy laws | Compliant with UAE PDPL, Saudi PDPL                   | Gray area — data leaves region           |
| Granularity      | Page views, countries, paths, referrers, status codes | Full event funnel, user journeys         |

### Setup

One-click enable in Cloudflare Dashboard → Web Analytics. No code changes needed. The beacon is collected at the edge — no JavaScript on the client.

### Limitations

- No user-level funnels (by design — privacy-first)
- No custom events (page views + basic metrics only)
- No A/B testing integration

### Supplement for advanced analytics

If you need conversion funnels and A/B testing:

- **Plausible Analytics** — self-hostable, privacy-first, ~$9/mo, custom events, GDPR-compliant
- **PostHog** — open-source, product analytics, feature flags, session recording; self-host on their cloud or your infra

**Recommendation:** Start with Cloudflare Web Analytics (free, zero effort). Add Plausible when you need conversion tracking for lead forms and dealer signups.

---

## 10. Backend Database: Supabase vs Neon vs PlanetScale

### The Recommendation: **Supabase**

| Factor                 | Supabase                                           | Neon                                     | PlanetScale                                |
| ---------------------- | -------------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| **Type**               | BaaS (Postgres + auth + storage + realtime + edge) | Serverless Postgres                      | Serverless MySQL + Postgres (GA Sept 2025) |
| **Free tier**          | ✅ 500MB DB, 50K MAU, 5GB storage                  | ✅ 0.5GB DB, 100hr compute               | ❌ No free tier (killed March 2024)        |
| **Postgres**           | ✅ Native                                          | ✅ Native                                | ✅ Added Sept 2025 (was MySQL-only)        |
| **Auth**               | ✅ Built-in (email, OAuth, phone)                  | ❌ DIY or use Clerk/Auth0                | ❌ DIY                                     |
| **Realtime**           | ✅ WebSocket subscriptions                         | ❌ No                                    | ❌ No                                      |
| **Edge Functions**     | ✅ Deno-based, 500K req/mo free                    | ❌ No                                    | ❌ No                                      |
| **Storage**            | ✅ S3-compatible, 5GB free                         | ❌ No                                    | ❌ No                                      |
| **Branching**          | ✅ Preview branches                                | ✅ Best-in-class (instant copy-on-write) | ✅ Schema branches                         |
| **Cold starts**        | 150ms (improved from 800ms)                        | N/A (persistent connections)             | N/A                                        |
| **Pricing after free** | $25/mo Pro                                         | $19/mo Scale                             | $39/mo Scaler Pro                          |
| **GCC latency**        | Good (AWS Bahrain + Frankfurt)                     | Good (AWS Frankfurt)                     | Fair (fewer regions)                       |
| **pgvector**           | ✅ Native                                          | ✅ Native                                | ❌ (MySQL-only for vectors)                |

### Why Supabase Wins for This Project

1. **Full-stack advantage:** The marketplace needs auth (dealers, buyers, admins), storage (listing photos, battery certs), realtime (live inventory updates, chat), and edge functions (AI search proxy, webhooks). Supabase bundles all of this. With Neon or PlanetScale, you'd need to integrate Clerk/Auth0 ($25+/mo), S3/Cloudflare R2, and a realtime service separately.

2. **pgvector for AI search:** The AI-powered search and recommendations feature needs vector embeddings. Supabase has native pgvector support. PlanetScale Postgres doesn't support it yet.

3. **Free tier is generous:** 500MB database, 50K monthly active users, 5GB storage, 1GB file bandwidth. Covers MVP launch and early traction before needing paid plans.

4. **GCC edge presence:** Supabase has projects in `ap-south-1` (Mumbai) and `eu-central-1` (Frankfurt) — both serve GCC users well. Cloudflare's 330+ edge network fronts the Next.js app; database queries are the only non-edge calls.

5. **Realtime for marketplace features:** WebSocket-based table subscriptions enable live inventory updates, real-time dealer dashboards, and instant lead notifications without polling.

### When Neon Would Be Better

- If you already have a mature auth/storage stack and only need Postgres
- If database branching is critical to your dev workflow (Neon's branching is superior)
- If you need per-branch environments for every PR (Neon's copy-on-write branching is instant and cheap)

### When PlanetScale Would Be Better

- If you're deeply invested in MySQL/Vitess ecosystem
- If you need their advanced schema change workflow (non-blocking migrations)
- Note: PlanetScale Postgres is new (GA Sept 2025) — ecosystem maturity trails Supabase and Neon

---

## 11. Recommended Stack Summary

```
┌─────────────────────────────────────────────────┐
│                  FINAL STACK                     │
├─────────────────────────────────────────────────┤
│ Frontend:      Next.js 14 (App Router)           │
│ Deployment:    Cloudflare Workers + OpenNext     │
│ Domain:        marketplace.nev3s.com (subdomain) │
│ Database:      Supabase (Postgres + pgvector)    │
│ Auth:          Supabase Auth (built-in)          │
│ Storage:       Cloudflare R2 (images + docs)     │
│ Image CDN:     Cloudflare Images                 │
│ Cache:         Workers KV (ISR + config)         │
│ Realtime:      Supabase Realtime                 │
│ Queues:        Cloudflare Queues                 │
│ Search:        pgvector + Supabase Postgres     │
│ AI:            Cloudflare Workers AI / OpenAI    │
│ Analytics:     Cloudflare Web Analytics          │
│ Forms:         Next.js Server Actions + Turnstile│
│ Email:         Resend / Loops.so (via Queues)    │
│ Monitoring:    Cloudflare Analytics + Sentry     │
│ CI/CD:         GitHub Actions + Wrangler         │
├─────────────────────────────────────────────────┤
│ ESTIMATED MONTHLY COST (Early Stage)             │
│ Cloudflare Free ...................... $0         │
│ Supabase Free ........................ $0         │
│ Cloudflare Images (under limits) ..... $0         │
│ Domain (existing nev3s.com) .......... $0         │
│ Resend (3K emails/mo) ................ $0         │
│ Sentry (5K errors/mo) ................ $0         │
│ TOTAL: ................................ $0/mo     │
├─────────────────────────────────────────────────┤
│ ESTIMATED MONTHLY COST (Scale — 50K listings)    │
│ Cloudflare Pro ....................... $20        │
│ Supabase Pro ......................... $25        │
│ Cloudflare Images (200K transforms) . $100        │
│ Resend (50K emails) .................. $20        │
│ Sentry ............................... $26        │
│ TOTAL: .............................. ~$191/mo    │
└─────────────────────────────────────────────────┘
```

---

## 12. Migration Path from Free Plan

The user is currently on Cloudflare Free. Here's when to upgrade:

| Trigger                                                 | Upgrade to           | Why                                          |
| ------------------------------------------------------- | -------------------- | -------------------------------------------- |
| Lead form spam/bot attacks exceed WAF rule capacity     | Pro ($20/mo)         | 20 custom WAF rules, dedicated rate limiting |
| Image transforms exceed 5,000/month                     | Pro ($20/mo)         | Remote image transforms included             |
| Need Polish/Mirage image optimization                   | Pro ($20/mo)         | Auto WebP/AVIF at edge                       |
| DDoS attack sophistication exceeds Free's bot detection | Pro + Bot Management | ML-based bot scoring                         |
| Need 100% uptime SLA                                    | Business ($200/mo)   | SLA, advanced WAF, prioritized support       |

**The Free plan is sufficient for MVP launch and early growth.** Upgrade incrementally based on actual needs, not pre-emptive scaling.

---

## Sources

- [OpenNext for Cloudflare — Official Docs](https://opennext.js.org/cloudflare)
- [Deploying Next.js to Cloudflare Workers with OpenNext — Cloudflare Blog](https://blog.cloudflare.com/deploying-nextjs-apps-to-cloudflare-workers-with-the-opennext-adapter/)
- [Cloudflare Workers Docs — OpenNext Adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [Cloudflare Images Pricing](https://developers.cloudflare.com/images/pricing/)
- [Cloudflare Images Pricing Detailed Breakdown (2026)](https://theimagecdn.com/docs/cloudflare-images-pricing)
- [Supabase vs Neon vs PlanetScale — TopInsight (2025)](https://topinsight.co/databases/neon-vs-supabase-vs-planetscale/)
- [Supabase vs Neon — Autonoma (2026)](https://getautonoma.com/blog/supabase-vs-neon)
- [Supabase Edge Functions vs Cloudflare Workers — PikVue (2026)](https://pikvue.com/supabase-edge-functions-vs-cloudflare-workers-vs-deno-deploy-2026/)
- [Serverless Postgres Benchmarks: Neon vs Supabase (2026)](https://postgres-benchmarks.devops-daily.com/)
- [Hosting Next.js on Cloudflare — Chris Gavin's Dev Blog](https://chrisgavin.dev/blog/nextjs-on-cloudflare)
- [Cloudflare WAF/Rate Limiting Plans](https://skilldential.com/cloudflare-reverse-proxy-edge-security-80-20/)
- [Cloudflare DDoS Threat Report H1 2026](https://radar.cloudflare.com/)
