# NEV3S Staging Website

Static marketing site for NEV3S, built as a dependency-light, review-friendly staging repository for the GCC automotive and mobility brand portfolio.

This repository is intended for content review, local preview, and pre-launch validation. It is not a full application framework and does not add runtime dependencies beyond the existing static build workflow.

## Current project status

The repository currently includes:

- A homepage at `index.html`
- Public pages for brands and offices
- Legal and compliance pages for privacy and cookie policy
- Shared content metadata in `content/site.json`
- Generated navigation and sitemap updates via `scripts/build.py`

## Recommended Copilot skills

This repo is intentionally simple, so the most useful setup is a minimal, practical skill set rather than a long list of extra tooling.

Recommended skills for this project:

- `expert-ui-ux-developer` — for layout polish, responsive improvements, and accessibility tuning
- `pylance-refactoring` — for small Python script cleanup and maintainability
- `agent-customization` — for repo-specific workflow guidance and consistent Copilot behavior
- `chronicle` — for session tracking and continuity across multi-step tasks

These are built-in Copilot capabilities in the current workspace and do not require a separate repo install step. They are intended to support the workflow without adding complexity.

## Repository structure

```text
.
├── index.html              # Homepage entry point
├── pages/                  # Public page templates and legal pages
├── assets/
│   ├── images/             # Approved photography and media
│   ├── logos/              # Brand and partner assets
│   └── icons/              # Favicons and UI assets
├── content/
│   └── site.json           # Registration data for pages and nav
├── styles/                 # Shared CSS
├── scripts/
│   ├── build.py            # Validates pages and regenerates nav/sitemap
│   └── new-page.py         # Creates a new registered page
├── sitemap.xml             # Generated public route map
├── robots.txt              # Basic crawler policy
├── package.json            # Lint and format scripts
├── eslint.config.js        # ESLint configuration
├── README.md               # Project documentation
├── .gitignore              # Repository ignore rules
├── package-lock.json       # Locked dependency state
└── node_modules/           # Installed local dependencies
```

## Public pages and routes

The site registry currently includes these public routes:

- `/` — Home
- `/pages/brands.html` — Brands
- `/pages/offices.html` — Offices
- `/pages/privacy-policy.html` — Privacy Policy
- `/pages/cookie-policy.html` — Cookie Policy

The `content/site.json` file is the source of truth for registered pages and homepage navigation. When a page is added or removed, run the build so the homepage nav and sitemap stay in sync.

## Local development

From the project root, install dependencies once if needed:

```bash
npm install
```

Start a local preview server:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

## Content workflow

Create a new page with the project helper:

```bash
python3 scripts/new-page.py insights "Insights" "NEV3S Insights"
```

This creates a new page file and registers it in `content/site.json`.

After any page or route change, regenerate the homepage nav and sitemap:

```bash
python3 scripts/build.py
```

The build validates that:

- all registered pages exist
- page paths are unique
- navigation labels are unique
- the sitemap reflects only public routes
- homepage navigation remains aligned with `content/site.json`

## Validation and quality checks

Run the project checks before considering the repository ready:

```bash
npm run lint
npm run format:check
python3 scripts/build.py
```

These checks ensure linting, formatting, and static content registry consistency are all green.

## Content and asset guidance

- Keep authored content factual, approved, and specific to real business operations.
- Use relative URLs when linking between pages and root assets.
- Preserve semantic HTML, visible focus styles, readable contrast, and reduced-motion support.
- Only use approved photography, logos, and partner references.
- Do not publish unverified claims, partner relationships, or office/legal details.

## Notes

This site is intentionally lightweight and deterministic. It does not add a framework or runtime layer for simple static marketing work; the generated nav and sitemap are the only output that should be rebuilt automatically.

Before any production or public launch, review the final content, verify all public routes, confirm legal language and contact details, and ensure the final build is clean.
