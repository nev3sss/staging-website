# NEV3S Staging Website

Static marketing website for NEV3S, built as a lightweight, dependency-light corporate landing experience for EV brand partnerships, GCC market expansion, service infrastructure, and lead capture.

This repository keeps the site easy to review and ship: plain HTML/CSS, a simple content registry, and a small Python build script instead of a heavier frontend framework. The goal is fast iteration, reliable route generation, and a clean staging flow for approved marketing changes.

## Current status

The production-facing site includes:

- a premium homepage and hero structure in `index.html`
- supporting public pages under `pages/`
- route metadata and nav source-of-truth in `content/site.json`
- shared styling and design tokens in `styles/`
- generated homepage navigation and `sitemap.xml` via `scripts/build.py`
- a HubSpot-form lead capture flow for the static site
- updated GCC contact details and clearer presence cards

## What was recently improved

- **Mobile navigation submenu fix** — tapping a parent nav link on mobile now expands its submenu in place, so links remain visible and tappable. Previously the link would navigate away before submenu items could be selected.
- **Hover gap bridge** — added invisible hit area between desktop nav items and their dropdowns to prevent the menu from accidentally closing when the cursor moves between them.
- **Section anchors** — added `id="top"` to `<header>` and `id="proof-panel"` to the business-value section for reliable in-page navigation.
- HubSpot lead form integration using the Forms API with fetch, JSON payloads, validation, inline messaging, and disabled submit state
- standardized phone contact details to `+966 56 556 920`
- improved homepage visual hierarchy and presence card contrast for better readability
- verified linting, formatting, and route-level build integrity

## Repository structure

```text
.
├── index.html              # Main landing page and site content
├── pages/                  # Public pages and legal/brand pages
├── assets/
│   ├── images/             # Approved photography and media
│   ├── logos/              # Brand and partner logo assets
│   └── icons/              # Favicons and UI assets
├── content/
│   └── site.json           # Source of truth for route metadata and nav
├── styles/                 # Shared CSS and design system styles
├── scripts/
│   ├── build.py            # Validates pages and regenerates nav + sitemap
│   └── new-page.py         # Creates and registers a new page
├── sitemap.xml             # Generated XML sitemap
├── robots.txt              # Basic crawler instructions
├── package.json            # Lint and format scripts
├── eslint.config.js        # ESLint configuration
├── README.md               # Project documentation
├── .gitignore              # Ignore rules for local and generated artifacts
├── package-lock.json       # NPM lockfile
├── node_modules/           # Installed dependencies (ignored by Git)
├── .github/
│   └── copilot-instructions.md
└── .vscode/                # Optional editor settings, if present
```

## Public routes

The site currently contains the following registered pages:

- `/` — Home
- `/pages/brands.html` — Brands
- `/pages/offices.html` — Offices
- `/pages/privacy-policy.html` — Privacy Policy
- `/pages/cookie-policy.html` — Cookie Policy

If pages are added, removed, or renamed, run the build so the generated navigation and sitemap stay aligned.

## Local workflow

Install dependencies once:

```bash
npm install
```

Start a local preview server:

```bash
python3 -m http.server 4173
```

Open the site in a browser at:

```text
http://localhost:4173/
```

## Content creation workflow

Create a registered page with the helper script:

```bash
python3 scripts/new-page.py insights "Insights" "NEV3S Insights"
```

After any page or route change, regenerate the homepage navigation and sitemap:

```bash
python3 scripts/build.py
```

The build validates that:

- registered pages exist
- page paths are unique
- nav labels are unique
- `sitemap.xml` reflects the public routes
- homepage navigation stays consistent with `content/site.json`

## Validation checks

Before considering the repo ready, run:

```bash
npm run lint
npm run format:check
python3 scripts/build.py
```

These checks validate formatting, linting, and static route integrity.

## Notes

- Use relative paths between pages and root assets.
- Keep content factual, approved, and aligned with actual NEV3S operations.
- Preserve semantic HTML, accessible focus indicators, readable contrast, and reduced-motion support.
- Keep the site lightweight; avoid adding framework overhead unless there is a clear product need.
- HubSpot form submission depends on the form’s CRM configuration. If API submissions are rejected, check the HubSpot form settings for spam/captcha restrictions.

This repo is intentionally lightweight and deterministic. The generated navigation and sitemap are build outputs, not source-of-truth content.
