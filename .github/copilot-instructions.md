# NEV3S Website Instructions

This repository is a dependency-light static corporate site. Prefer semantic HTML, shared CSS, and progressive enhancement over adding a framework or runtime dependency.

- Run `npm run lint`, `npm run format:check`, and `python3 scripts/build.py` after relevant changes.
- Use `python3 scripts/new-page.py` to create registered pages; do not manually edit generated navigation between the `GENERATED:NAV-START` and `GENERATED:NAV-END` markers.
- Keep asset and page links relative. Pages in `pages/` must use `../` paths to root assets and `index.html`.
- When public routes change, run the build to regenerate and validate `sitemap.xml`.
- Preserve accessible semantic structure, keyboard navigation, visible focus styles, meaningful image `alt` text, and reduced-motion support.
- Do not invent or publish unapproved business claims, partner relationships, office details, legal copy, logos, or photography.
- Keep authored content changes focused. Do not alter generated files unless the associated source data has changed.
