# NEV3S Corporate Website

Static corporate website foundation for NEV3S, the Chinese EV master franchise and new energy vehicle ecosystem partner for the GCC.

## Current Status

- `index.html` is the current single-page homepage and working preview.
- The repository is prepared for additional pages, shared content, and local media.
- No binary media is checked in yet. Add approved brand assets and photography before publishing them.

## Project Structure

```text
.
├── index.html              # Homepage entry point
├── pages/                  # Additional top-level HTML pages
├── assets/
│   ├── images/             # Hero, office, workshop, and editorial photography
│   ├── logos/              # NEV3S and partner brand logos
│   └── icons/              # Favicons, UI icons, and small illustrations
├── content/                # Reusable copy, data, and page content
├── styles/                 # Shared CSS extracted from page templates
└── scripts/                # Shared JavaScript and page behavior
```

## Planned Pages

The next pages can be added under `pages/` without changing the asset layout. They are intentionally not registered until their content is ready:

- `about.html` - company, leadership, and operating model
- `ecosystem.html` - charging, workshops, battery repair, training, and aftermarket
- `brands.html` - partner brand profiles and market coverage
- `offices.html` - GCC locations and contact details
- `contact.html` - institutional inquiry workflow

Keep navigation paths relative when linking from `pages/`, for example `../assets/logos/brand-name.svg` and `../index.html#contact`.

## Content Workflow

1. Create the page in `pages/` using the shared structure and relative asset paths.
2. Add its `path`, `label`, and `public` status to `content/site.json`.
3. Add any reusable copy or structured data to `content/` rather than duplicating it in multiple pages.
4. Run `python3 scripts/build.py` from the repository root.
5. Review the generated navigation and sitemap, then run the local preview before publishing.

The build fails when a registered page is missing. This makes navigation and sitemap references auditable before deployment.

## Asset Guidelines

- Use lowercase, descriptive filenames with hyphens, such as `riyadh-workshop.jpg`.
- Store source images in `assets/images/` and optimized delivery files alongside them.
- Store official, approved logos in `assets/logos/`; do not use unlicensed brand artwork.
- Prefer responsive images, explicit `width` and `height`, and meaningful `alt` text.
- Keep originals out of the public bundle unless they are needed for future editing.

## Local Preview

From the repository root, run:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173/>.

## Publishing Checklist

Before launch, replace any business contact or legal copy that is still provisional, configure a real form submission endpoint, add approved social preview images, and verify every external brand and social link.