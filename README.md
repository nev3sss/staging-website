# NEV3S Staging Website

Static marketing website for the NEV3S brand portfolio, built as a lightweight, dependency-light hub for review, content validation, and staged marketing updates.

This repository is intentionally simple: it uses static HTML/CSS, a content registry, and a small Python build step instead of introducing a framework or heavier runtime complexity. The goal is fast review cycles, clear content governance, and reliable page generation.

## Current status

The project currently includes:

- A premium corporate homepage in `index.html`
- Supporting public pages under `pages/`
- Core metadata and page registration in `content/site.json`
- Shared styling under `styles/`
- Generated navigation and sitemap updates via `scripts/build.py`
- A lightweight static publishing workflow suitable for staging and review

## Project goals

This repo supports:

- review-ready marketing copy and layout changes
- public route validation before launch
- generated navigation and sitemap consistency
- lightweight local preview without framework overhead
- clean update flows for content, legal, and brand pages

## Recommended minimal Copilot skill set

For this repository, a focused skill set is enough. Avoid adding unnecessary tooling and keep the workflow simple.

Recommended skills:

- `expert-ui-ux-developer` — layout refinement, responsiveness, accessibility, and visual polish
- `pylance-refactoring` — Python maintenance for build and workflow scripts
- `agent-customization` — repo-specific guidance and consistent Copilot behavior
- `chronicle` — continuity for multi-step editorial or design work

These are lightweight, practical additions that fit the current static-site approach without overcomplicating the project.

## Repository structure

```text
.
├── index.html              # Homepage and primary marketing landing page
├── pages/                  # Public pages, including legal and brand pages
├── assets/
│   ├── images/             # Approved photography and media
│   ├── logos/              # Brand and partner logo assets
│   └── icons/              # Favicons and UI assets
├── content/
│   └── site.json           # Source of truth for pages and nav metadata
├── styles/                 # Shared site styles
├── scripts/
│   ├── build.py            # Validates page registry and regenerates nav/sitemap
│   └── new-page.py         # Creates and registers a new page
├── sitemap.xml             # Generated route map for public pages
├── robots.txt              # Basic crawler policy
├── package.json            # Lint and format scripts
├── eslint.config.js        # Lint configuration
├── README.md               # Project documentation
├── .gitignore              # Ignore rules for local and generated artifacts
├── package-lock.json       # Lockfile for npm dependencies
├── node_modules/           # Installed dependencies for local validation
└── .github/
    └── copilot-instructions.md
```

## Public routes

The current page registry includes the following public routes:

- `/` — Home
- `/pages/brands.html` — Brands
- `/pages/offices.html` — Offices
- `/pages/privacy-policy.html` — Privacy Policy
- `/pages/cookie-policy.html` — Cookie Policy

The source of truth is `content/site.json`. If pages are added, removed, or renamed, run the build so the generated homepage navigation and sitemap stay aligned.

## Local workflow

Install dependencies once if needed:

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

Create a new registered page with the helper script:

```bash
python3 scripts/new-page.py insights "Insights" "NEV3S Insights"
```

This creates a page file and updates the registry in `content/site.json`.

After any page or route change, regenerate the homepage navigation and sitemap:

```bash
python3 scripts/build.py
```

The build checks that:

- registered pages exist
- page paths are unique
- nav labels are unique
- public routes are reflected in `sitemap.xml`
- homepage navigation stays consistent with `content/site.json`

## Validation checks

Run these checks before considering the repo ready:

```bash
npm run lint
npm run format:check
python3 scripts/build.py
```

These checks validate formatting, linting, and static content registry integrity.

## Content and asset guidance

- Keep content factual, approved, and aligned to actual NEV3S operations
- Use relative paths between pages and root assets
- Preserve semantic HTML, accessible focus states, readable contrast, and reduced-motion support
- Only use approved logos, photography, and business references
- Avoid publishing unverified claims, legal language, or office details without approval

## Notes

This project is intentionally lightweight and deterministic. It does not add a framework or runtime layer for simple marketing work; the generated navigation and sitemap are the only outputs that should be rebuilt automatically.

Before public launch, review the final copy, verify all routes, confirm legal language and contact details, and ensure the build stays clean.
