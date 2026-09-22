# NEV3S Website Instructions

This repository is a dependency-light static corporate site. Prefer semantic HTML, shared CSS, and progressive enhancement over adding a framework or runtime dependency.

## Build & Validation

- Run `npm run lint`, `npm run format:check`, and `python scripts/build.py` after relevant changes.
- On Windows, use `py` (not `python3`) to invoke Python scripts.
- Use `python scripts/new-page.py` to create registered pages; do not manually edit generated navigation between the `GENERATED:NAV-START` and `GENERATED:NAV-END` markers.
- Keep asset and page links relative. Pages in `pages/` must use `../` paths to root assets and `index.html`.
- When public routes change, run the build to regenerate and validate `sitemap.xml`.

## Accessibility Requirements (WCAG AA)

All pages must meet WCAG 2.1 AA conformance. The build script (`scripts/build.py`) validates the following automatically:

### Color Contrast

- **Normal text (< 18px / < 14px bold):** minimum **4.5:1** contrast ratio against its background.
- **Large text (≥ 18px / ≥ 14px bold):** minimum **3:1** contrast ratio.
- **UI components and focus indicators:** minimum **3:1** contrast ratio.
- Validate with WebAIM Contrast Checker or browser DevTools before merging CSS changes.
- Do not use `rgba()` semi-transparent text colors on backgrounds without verifying the effective computed contrast.

### Keyboard Navigation

- All interactive elements (`<a>`, `<button>`, `<input>`, `<select>`, `<textarea>`) must be keyboard-focusable and operable.
- **Visible focus states:** every focusable element must show a visible focus outline (minimum 2px, high-contrast). Use `:focus-visible` for keyboard focus and `:focus` as fallback.
- Tab order must follow visual reading order (left-to-right, top-to-bottom).
- Skip-to-main-content link must be the first focusable element on every page.

### Semantic HTML

- Use proper heading hierarchy: exactly one `<h1>` per page, followed by `<h2>`, `<h3>` — no skipped levels.
- Use `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>` landmark elements.
- Every page must have `<main id="main-content">` as the skip-link target.
- Use `<button>` for actions, `<a>` for navigation — never `<div onclick>`.

### ARIA & Labels

- Icon-only buttons must have `aria-label` or `aria-labelledby` providing an accessible name.
- Decorative images: `alt=""` (empty alt). Content images: descriptive `alt` text.
- Navigation regions must have `aria-label` (e.g., `aria-label="Main navigation"`).
- Active nav item must have `aria-current="page"`.
- `<iframe>` elements must have a descriptive `title` attribute.
- Form inputs must have associated `<label for="id">` or `aria-label`.
- Use `role="list"` / `role="listitem"` when custom markup replaces native list semantics.

### Image & Media Accessibility

- All `<img>` tags must have `alt` text.
- All `<img>` tags should have explicit `width` and `height` attributes to prevent Cumulative Layout Shift (CLS).
- Non-critical images should use `loading="lazy"` for performance.
- Above-the-fold / hero images should use `loading="eager"` or omit the attribute.
- Provide `<picture>` with WebP/AVIF `srcset` for responsive images where feasible.
- `<video>` must have captions or a transcript. Audio content must have a text alternative.

### Reduced Motion

- Respect `prefers-reduced-motion: reduce` — disable animations, transitions, and smooth scroll.
- Test with the media query active to ensure content is still readable.

### Touch Targets

- Minimum **44px × 44px** touch target size on mobile for all interactive elements.

## Performance Requirements (Core Web Vitals)

- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **INP** (Interaction to Next Paint): < 200ms
- Inline critical CSS; load non-critical CSS asynchronously.
- Use `preconnect` and `dns-prefetch` for third-party origins (fonts, analytics).
- Compress all images to WebP/AVIF before deployment.
- Use `srcset` for responsive image resolution switching.

## Content Guidelines

- Do not invent or publish unapproved business claims, partner relationships, office details, legal copy, logos, or photography.
- Keep authored content changes focused. Do not alter generated files unless the associated source data has changed.
- Content must be factual, approved, and aligned with actual NEV3S operations.
