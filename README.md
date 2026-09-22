# NEV3S Staging Website

Static marketing website for NEV3S — GCC's first dedicated EV sales, service, and spare parts platform. Built as a lightweight, dependency-light corporate experience for brand partnerships, market expansion, service infrastructure, and lead capture.

This repository keeps the site easy to review and ship: plain HTML/CSS, a content registry, and Python build scripts instead of a heavier frontend framework. The goal is fast iteration, reliable route generation, and a clean staging flow for approved marketing changes.

## Design Guideline Principles

This site follows the NEV3S design guideline (`docs/design-guideline.md`), which specifies enterprise-grade visual identity with strict accessibility and performance standards:

### Accessibility (WCAG 2.1 AA)

- **Color contrast:** All text passes WCAG AA — 4.5:1 for normal text, 3:1 for large text and UI components.
- **Keyboard navigation:** All interactive elements are keyboard-focusable with visible focus states (minimum 2px outline, high contrast).
- **Semantic HTML:** Proper heading hierarchy (one `<h1>` per page, no skipped levels), landmark elements (`<nav>`, `<main>`, `<header>`, `<footer>`), and ARIA labels on icon buttons.
- **Skip link:** Every page has a skip-to-main-content link as the first focusable element.
- **Image alt text:** All `<img>` tags have `alt` attributes — descriptive for content images, empty (`alt=""`) for decorative images.
- **Form labels:** All form inputs have associated `<label for="id">` or `aria-label`.
- **Reduced motion:** `prefers-reduced-motion: reduce` is respected — animations and smooth scroll are disabled.
- **Touch targets:** Minimum 44×44px on mobile for all interactive elements.

### Performance (Core Web Vitals)

- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **INP** (Interaction to Next Paint): < 200ms
- **Resource hints:** `preconnect` and `dns-prefetch` for third-party origins (Google Fonts, Plausible analytics).
- **Image optimization:** WebP/AVIF with `srcset` for responsive resolution switching; `loading="lazy"` on below-the-fold images.
- **Critical CSS:** Inlined in `<head>` for above-the-fold rendering.
- **CDN delivery:** All assets served via Cloudflare Pages CDN with Brotli compression and long-cache immutable headers.

### Security Headers

- **CSP:** Content-Security-Policy restricts script/style/img/font/connect sources.
- **X-Frame-Options:** `DENY` — prevents clickjacking.
- **X-Content-Type-Options:** `nosniff` — prevents MIME sniffing.
- **Referrer-Policy:** `strict-origin-when-cross-origin`.
- **Permissions-Policy:** Disables geolocation, microphone, camera, payment, and other sensitive APIs.
- **HSTS:** `max-age=63072000; includeSubDomains; preload`.

## Current status

The production-facing site covers:

- a premium homepage and hero in `index.html`
- 9 supporting public pages under `pages/` (plus 3 dealer-portal pages under `pages/dealers/`)
- a bilingual dealer application portal under `pages/dealers/` (EN + AR)
- a Cloudflare Worker API powering the dealer application endpoint
- route metadata and nav source-of-truth in `content/site.json`
- shared styling and design tokens in `styles/`
- generated homepage navigation and `sitemap.xml` via `scripts/build.py`
- audit-compliant page generator at `scripts/new-page.py` (OG, Twitter, JSON-LD, skip-link, main#main-content, all in one)
- accessibility validation in `scripts/build.py` (alt text, ARIA labels, skip links, form labels, loading attributes, viewport meta)
- a HubSpot-form lead capture flow for the static site
- updated GCC contact details and clearer presence cards
- full SEO stack (meta, OG, Twitter, canonical, JSON-LD) on every page
- security-hardened `_headers` file for Cloudflare Pages (CSP, HSTS, resource hints, caching)

## What was recently done

### Enterprise UI/UX Overhaul

- Full-viewport hero with dark gradient overlay, dual CTAs, animated scroll cue
- Header transparent→solid on scroll, IntersectionObserver scroll reveals
- Card hover scale+shadow, button micro-interactions, gradient section dividers
- Pure #000→charcoal #0e1116, grayscale-to-color brand logos
- Dark mode support (`prefers-color-scheme` + `[data-theme]` manual toggle)
- Hamburger menu with off-canvas mobile nav, 44px touch targets
- `loading="lazy"` on all images, reveal hooks on all sections
- Comprehensive accessibility validation in `scripts/build.py`
- Security headers hardened (CSP enforced, HSTS preload, nosniff, Referrer-Policy)
- Resource hints and granular caching in `_headers`

### Dealer Application Portal (feature/dealership-signup branch)

- **Cloudflare Worker** (`workers/`) — deployed and live at `https://nev3s-dealership-api.nev3s-dev.workers.dev`
  - `POST /api/v1/dealer-applications` — Turnstile-verified application submission → D1 insert
  - `GET /api/v1/health` — health check (no auth)
  - 8 email templates defined in `workers/src/lib/email.ts`; `sendEmail()` is currently a stub (logs to console — wire to Resend before going live)
  - Admin auth stub: `requireAdmin` middleware in `routes/admin.ts` is a placeholder pending JWT verification
  - R2 document storage, D1 database, KV feature flags
  - Cron stubs in `workers/src/lib/cron.ts` (daily 06:00 UTC, 1st of month 07:00 UTC) — handlers log only
  - All secrets set via `wrangler secret put`; `.dev.vars` gitignored
  - CI/CD via `.github/workflows/deploy-worker.yml` (auto-deploys on push to `main`)
- **`pages/dealers/apply.html`** — full bilingual dealer application page
  - Cloudflare Turnstile anti-bot widget
  - Complete 3-section form (contact details, business details, dealer profile)
  - Live client-side validation + server-side 422 error display
  - Launch incentive callout, trust strip, 4-step journey, value props, FAQ, comparison table
  - Posts to Worker endpoint via `fetch()` with `x-turnstile-token` header
- **`pages/dealers/apply-ar.html`** — Arabic RTL placeholder (directs to EN version)
- **`pages/dealers/dashboard.html`** — dealer portal placeholder (Phase 2, launching Jan 1 2027)
- **`scripts/dealers/`** — `config.js` (Turnstile sitekey + API URL), `form-validation.js`, `form-submit.js`
- **`styles/dealers/`** — `dealers.css`, `dealers-ar.css` — NEV3S design tokens throughout
- `content/site.json` — nav entry "Dealers" → `pages/dealers/apply.html`; 3 dealer page registrations
- Sitemap regenerated with both dealer page URLs

**CI/CD prerequisite** (before merging to `main`):

- Set GitHub secret `CLOUDFLARE_API_TOKEN` = `cfut_...`
- Set GitHub variable `CLOUDFLARE_ACCOUNT_ID` = account ID from `wrangler whoami`

See `workers/SETUP.md` for the full resource map and endpoint table.

### Marketplace Page (merged to main)

- **`pages/marketplace.html`** — GCC's first EV marketplace landing page, launching January 1, 2027
  - Live countdown to launch, trust stats, 12-card feature grid, buyer/seller split, 4-step flow
  - 12-row comparison table (NEV3S vs. general classifieds), testimonials, 8 FAQs, highlight CTA
- Homepage ecosystem section updated: 6th pillar "EV Marketplace & Dealer Software" with launch badge

### Homepage Ecosystem & Navigation

- 6 ecosystem pillars covering charging infrastructure, workshop setup, battery repair, HV training, aftermarket, and EV marketplace
- Homepage "Dealers" nav link → `pages/dealers/apply.html`
- Nav auto-generated by `scripts/build.py` from `content/site.json`

### UX & Accessibility

- Mobile navigation submenu fix — parent links expand submenus on tap
- Hover gap bridge — invisible hit area between nav items and dropdowns prevents accidental close
- Section anchors: `id="top"` on `<header>`, `id="proof-panel"` on business-value section
- HubSpot lead form with fetch, JSON payload, inline messaging, disabled submit state
- Emoji country flags replaced with inline SVGs in office presence cards and footer

### SEO & Meta

- Full Open Graph + Twitter Card meta on all pages
- JSON-LD structured data (Organization on homepage; per-page WebPage/AutoDealer/FAQPage schemas)
- Canonical URLs, robots meta, keywords meta on every page
- `sitemap.xml` auto-generated from `content/site.json`

### Contact & Copy

- Standardized phone: `+966 56 556 920` across all pages
- YouTube link updated to official NEV3S channel
- Cookie/Privacy nav path corrected to `brands.html` (was `../pages/brands.html`)

### SEO completeness — all pages

Every page now has the full SEO stack:

- `<meta name="description">` 70–165 characters
- `<link rel="canonical">` with absolute URL
- `<meta property="og:title">`, `og:description`, `og:type`, `og:url`, `og:image`, `og:image:width/height`
- `<meta name="twitter:card">` with card content
- `<meta name="viewport">`
- `<script type="application/ld+json">` with `WebPage`, `AboutPage`, or `FAQPage` schema
- `<meta name="robots">` set appropriately per page

### Accessibility — legal pages

- Skip-to-main-content link added to `privacy-policy.html` and `cookie-policy.html`
- `<main id="main-content">` added to both legal pages for skip-link target
- Full keyboard focus styles on the skip link

## Repository structure

```text
.
├── index.html                    # Main landing page and site content
├── pages/                       # Public pages
│   ├── brands.html               # Brand partner showcase
│   ├── marketplace.html          # EV Marketplace landing (launching Jan 1, 2027)
│   ├── offices.html              # GCC office locations
│   ├── solutions.html            # EV solutions overview
│   ├── service-network.html      # Service & aftermarket
│   ├── franchise-opportunities.html
│   ├── spare-parts.html
│   ├── privacy-policy.html
│   ├── cookie-policy.html
│   └── dealers/                  # Dealer application portal
│       ├── apply.html            # Dealer application form (EN)
│       ├── apply-ar.html         # Dealer application form (AR — placeholder)
│       └── dashboard.html        # Dealer portal (Phase 2 — placeholder)
├── assets/
│   ├── images/
│   ├── logos/
│   └── icons/
├── content/
│   └── site.json                # Source of truth for route metadata and nav
├── styles/
│   ├── page-shell.css           # Homepage styles + design tokens
│   ├── brands.css               # Brand card styles
│   ├── offices.css              # Office/contact styles
│   └── dealers/                 # Dealer portal styles
│       ├── dealers.css          # EN styles
│       └── dealers-ar.css       # AR RTL styles
├── scripts/
│   ├── build.py            # Validates pages, generates nav + sitemap, checks accessibility
│   ├── link-checker.py     # Audits all links on nev3s.com
│   └── new-page.py         # Creates and registers a new page
├── workers/                     # Cloudflare Worker (dealer API)
│   ├── wrangler.toml            # Bindings (committed; no secrets)
│   ├── .dev.vars                # Local secrets (gitignored)
│   ├── .dev.vars.example        # Template without secrets
│   ├── SETUP.md                 # Live URL, resource IDs, secrets, API table
│   ├── package.json
│   ├── tsconfig.json
│   ├── migrations/
│   │   └── 0001_initial_schema.sql
│   └── src/
│       ├── index.ts
│       ├── lib/ (responses, turnstile, ids, cron, email)
│       └── routes/ (dealer-applications, enquiries, documents, admin)
├── docs/                        # Feature planning & documentation
├── sitemap.xml             # Generated XML sitemap
├── robots.txt              # Crawler instructions
├── _headers                 # Cloudflare Pages security + performance headers
├── package.json            # Lint and format scripts
├── eslint.config.js        # ESLint configuration
├── README.md               # Project documentation
├── .gitignore              # Ignore rules for local and generated artifacts
├── package-lock.json       # NPM lockfile
├── node_modules/           # Installed dependencies (ignored by Git)
├── .github/
│   └── workflows/
│       └── deploy-worker.yml    # CI/CD: auto-deploys Worker on push to main
└── .gitignore
```

## Public routes

All registered in `content/site.json` and generated into `sitemap.xml` and homepage nav:

| Route                                 | Label                   | Notes                                               |
| ------------------------------------- | ----------------------- | --------------------------------------------------- |
| `/`                                   | Home                    | Homepage with ecosystem pillars + HubSpot lead form |
| `/pages/brands.html`                  | Brands                  | Brand partner showcase                              |
| `/pages/marketplace.html`             | Marketplace             | EV marketplace landing (Jan 1, 2027)                |
| `/pages/offices.html`                 | Offices                 | GCC office locations                                |
| `/pages/solutions.html`               | Solutions               | EV solutions overview                               |
| `/pages/service-network.html`         | Service Network         | Service & aftermarket                               |
| `/pages/franchise-opportunities.html` | Franchise Opportunities | Franchise program                                   |
| `/pages/spare-parts.html`             | Spare Parts             | Regional spare parts                                |
| `/pages/privacy-policy.html`          | Privacy Policy          | Legal                                               |
| `/pages/cookie-policy.html`           | Cookie Policy           | Legal                                               |
| `/pages/dealers/apply.html`           | Dealership Application  | Dealer signup form (EN)                             |
| `/pages/dealers/apply-ar.html`        | تقديم طلب وكالة         | Dealer signup form (AR)                             |
| `/pages/dealers/dashboard.html`       | Dealer Portal           | Phase 2 (not indexed)                               |

If pages are added, removed, or renamed, run the build so the generated navigation and sitemap stay aligned.

## Local workflow

Install dependencies once:

```bash
npm install
```

Start a local preview server:

```bash
py -m http.server 4173
```

Open the site in a browser at:

```
http://localhost:4173/
```

## Content creation workflow

Create a registered page with the helper script:

```bash
py scripts/new-page.py insights "Insights" --title "NEV3S Insights" --description "..."
```

After any page or route change, regenerate the homepage navigation and sitemap:

```bash
py scripts/build.py
```

The build validates that:

- registered pages exist
- page paths are unique
- nav labels are unique
- `sitemap.xml` reflects the public routes
- homepage navigation stays consistent with `content/site.json`
- HTML pages have `lang` attribute, skip-link, `<main>` element, alt text on images, form labels, viewport meta, loading attributes, and iframe titles

## Validation checks

Before considering the repo ready, run:

```bash
npm run lint
npm run format:check
py scripts/build.py
```

> **Note:** On Windows, use `py` to invoke Python. On other systems, use `python3`.

These checks validate formatting, linting, static route integrity, and accessibility conformance.

## Notes

- Use relative paths between pages and root assets.
- Keep content factual, approved, and aligned with actual NEV3S operations.
- Preserve semantic HTML, accessible focus indicators, readable contrast, and reduced-motion support.
- Keep the site lightweight; avoid adding frontend framework overhead unless there is a clear product need.
- HubSpot form submission depends on the form's CRM configuration. If API submissions are rejected, check the HubSpot form settings for spam/captcha restrictions.
- Dealer application form submissions are handled by the Cloudflare Worker at `https://nev3s-dealership-api.nev3s-dev.workers.dev`. Do not hard-code secrets in client-side scripts.
- `scripts/dealers/config.js` contains only the Turnstile **site key** (not secret) and the Worker **public URL** — safe to commit.
- The `dashboard.html` dealer portal is Phase 2 work planned for launch alongside the marketplace on January 1, 2027.

This repo is intentionally lightweight and deterministic. The generated navigation and sitemap are build outputs, not source-of-truth content.
