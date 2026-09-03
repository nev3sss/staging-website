# Publishing Scripts

## `scripts/build.py`

Run `python3 scripts/build.py` from the repository root after changing `content/site.json`.

The script validates registered page paths, updates generated navigation in `index.html`, and writes `sitemap.xml`. Keep generated navigation between the `GENERATED:NAV-START` and `GENERATED:NAV-END` markers.

## `scripts/new-page.py`

Generate a fully-formed, audit-compliant new page in one command. Writes the HTML file, registers it in `content/site.json`, and (optionally) runs `build.py` to regenerate `sitemap.xml` and the homepage nav.

### Usage

```bash
python scripts/new-page.py <slug> <label> \
  --title "Page Title" \
  --description "70-165 char meta description" \
  --section top \
  --schema webpage
```

### Required Arguments

| Argument        | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `slug`          | URL slug (e.g. `insights`) — must match `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `label`         | Navigation label (e.g. `Insights`) — must be unique                  |
| `--title`       | Page title, max 70 characters                                        |
| `--description` | Meta description, 70–165 characters                                  |

### Optional Flags

| Flag         | Default        | Notes                                                              |
| ------------ | -------------- | ------------------------------------------------------------------ |
| `--section`  | `top`          | `top` (after Brands) / `company` (submenu) / `solutions` (submenu) |
| `--schema`   | `organization` | `organization` / `webpage` / `autodealer` / `faqpage`              |
| `--keywords` | NEV3S defaults | Comma-separated meta keywords                                      |
| `--public`   | true           | Include in sitemap, set `index, follow`                            |
| `--private`  | —              | Exclude from sitemap, set `noindex, nofollow`                      |
| `--dry-run`  | —              | Print generated HTML to stdout; no files written                   |
| `--no-build` | —              | Skip `build.py` after generation                                   |

### What gets generated

Every element from the audit checklist is included in the new page:

- `<meta>` tags: charset, viewport, description, robots, keywords
- `<title>` and brand suffix `| NEV3S`
- Open Graph: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`
- `<link rel="canonical">` with full absolute URL
- `<link rel="icon">`, Google Fonts preconnect + stylesheet
- CSS: `../styles/page-shell.css` and `../styles/brands.css`
- JSON-LD `<script type="application/ld+json">` block (per `--schema`)
- Accessibility: skip-link, `aria-label` on nav, `aria-labelledby` on hero
- Full nav block: logo, all 6 existing items, active state on the new page
- `<main id="main-content">` with hero (eyebrow + h1 + intro paragraph)
- Content scaffold: section-intro, card-grid (3 placeholder cards)
- CTA band linking to `index.html#contact`
- Footer with copyright, footer nav

### Example

```bash
# Preview without writing
python scripts/new-page.py insights "GCC Insights" \
  --title "GCC EV Market Insights 2026" \
  --description "Regular analysis of EV adoption trends, policy developments, and sales data across the six GCC markets." \
  --section top --schema webpage --dry-run

# Create and register (runs build.py automatically)
python scripts/new-page.py insights "GCC Insights" \
  --title "GCC EV Market Insights 2026" \
  --description "Regular analysis of EV adoption trends, policy developments, and sales data across the six GCC markets." \
  --section top --schema webpage
```
