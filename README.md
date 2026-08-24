# NEV3S Corporate Website

Static corporate website foundation for NEV3S, the Chinese EV master franchise and new energy vehicle ecosystem partner for the GCC.

> Repository notice: This is a staging website repository for development, content review, and preview only. It is not the live public business website and should not be treated as production-facing or customer-critical. Changes here are intended for staging validation and review before any production deployment.

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

## Corporate Website Plan

### 1. Objectives and Success Criteria

The website should position NEV3S as a credible, regional operating partner for Chinese new-energy vehicle brands and convert qualified institutional interest into measurable conversations.

Primary objectives:

- Explain the NEV3S master franchise and market-entry proposition clearly within the first visit.
- Show the breadth of the partner-brand portfolio and the depth of the complete NEV ecosystem.
- Establish trust through verifiable locations, leadership, operating capabilities, approved partnerships, and business contact details.
- Generate qualified enquiries from vehicle manufacturers, distributors, fleet operators, investors, suppliers, and GCC market partners.
- Provide a maintainable, fast, accessible static site that can expand without introducing unnecessary platform complexity.

Success should be measured by qualified contact submissions, partner enquiries, engagement with the ecosystem and brands pages, organic search impressions, page performance, accessibility conformance, and the percentage of enquiries that receive a documented follow-up.

### 2. Audiences and Core Messages

The primary audience is Chinese EV and new-energy vehicle manufacturers seeking structured GCC market access. Secondary audiences include local distributors, fleet and mobility operators, charging and service suppliers, investors, government and institutional stakeholders, and potential employees.

The content should consistently communicate four messages:

1. NEV3S is a single regional partner for market entry and scalable operations across the GCC.
2. The company connects sales, service, spare parts, charging, battery repair, training, and aftermarket support.
3. NEV3S combines local execution with an understanding of Chinese automotive technology and brand requirements.
4. Engagement starts with a practical business conversation, supported by clear locations and contact routes.

### 3. Information Architecture

Use the homepage as the commercial overview and add focused pages as their content is approved:

- **Home:** positioning, proof points, ecosystem overview, featured brands, GCC presence, FAQs, and a strong enquiry CTA.
- **About:** company purpose, leadership, operating model, governance, and regional capability.
- **Ecosystem:** charging infrastructure, workshops, battery repair, technician training, spare parts, and lifecycle support.
- **Brands:** searchable or grouped partner-brand profiles, market status, vehicle categories, and official links.
- **Offices:** country coverage, addresses, local contacts, and a clear headquarters designation.
- **Contact:** enquiry types, form, contact details, response expectations, privacy notice, and alternative contact methods.
- **Insights:** optional future publishing area for market analysis, launches, partnerships, and technical expertise.

Keep the primary navigation short and task-oriented. Every page should offer a visible route to contact NEV3S, while secondary links should support trust, legal compliance, and social profiles without competing with the main enquiry path.

### 4. Content and Data Plan

Before publishing each page, the content owner should approve the facts, claims, names, dates, locations, market availability, and partner relationships. Avoid implying a signed representation, launch date, or market presence until it is contractually and legally verified.

Store reusable structured content under `content/` where practical. A future content model should separate:

- Site-wide identity, navigation, contact details, and social links.
- Brand name, category, description, logo, official website, GCC status, and approved markets.
- Country office name, city, address, telephone, email, opening hours, and map link.
- Service offering title, summary, proof point, image, and related enquiry type.

Each content item should have an owner, approval status, last-reviewed date, and source reference in the team’s content register. Copy should be concise, specific, and evidence-led. Use real photography and approved logos only; placeholder assets must be visibly documented and replaced before launch.

### 5. Experience and Visual Direction

The experience should feel authoritative, modern, and operational rather than like a generic automotive showroom. Prioritize scanning, strong hierarchy, restrained motion, and clear next actions.

- Lead with the NEV3S proposition, GCC scope, and a direct business CTA.
- Use consistent page headers, section spacing, cards, link treatments, and responsive grids.
- Present the five ecosystem capabilities as concrete operating services, not abstract slogans.
- Make brand and office information easy to compare on mobile and desktop.
- Use approved photography that shows actual vehicles, facilities, people, and operational capability.
- Maintain strong contrast, visible focus states, readable type, and layouts that remain useful when images or web fonts fail.
- Respect `prefers-reduced-motion` and avoid animation that delays access to content or controls.

### 6. Technical Delivery

Keep the current dependency-free architecture unless a demonstrated requirement justifies a change. Author semantic HTML, shared CSS, and small progressive-enhancement scripts. Use the existing build workflow for page registration, navigation validation, and sitemap generation.

Implementation standards:

- Keep generated navigation between the existing `GENERATED:NAV-START` and `GENERATED:NAV-END` markers.
- Use relative paths from pages under `pages/` and verify links from both the homepage and nested pages.
- Give images explicit dimensions, meaningful `alt` text, and appropriate loading behavior.
- Use canonical URLs, Open Graph and Twitter metadata, descriptive titles, and page-specific descriptions.
- Maintain `robots.txt` and `sitemap.xml` whenever public routes change.
- Keep forms accessible, validate input on the server or receiving service, and never expose secrets in frontend files.
- Use external brand links with `target="_blank"`, `rel="noopener"`, and descriptive accessible labels where appropriate.
- Keep JavaScript optional for core navigation, content, and contact information.

### 7. SEO, Accessibility, and Compliance

Every public page should have one meaningful H1, a logical heading hierarchy, a unique title and description, canonical metadata, descriptive link text, and structured data that reflects only verified facts. Add relevant organization, local business, breadcrumb, FAQ, and article schema only when the page content supports it.

Target WCAG 2.2 AA practices: keyboard-complete interaction, visible focus, sufficient color contrast, correct landmarks, labelled forms, accessible error states, meaningful alternative text, reduced-motion support, and no information conveyed by color alone. Test with keyboard navigation, a screen reader spot check, browser zoom to 200%, and narrow mobile widths.

Publish a privacy notice and cookie or analytics disclosure appropriate to the jurisdictions served. Define consent, enquiry retention, data access, and deletion procedures before connecting a production form or analytics platform. Obtain permission for all photography, logos, testimonials, trademarks, and third-party copy.

### 8. Performance and Security Targets

Aim for a fast first render on mobile networks and stable layouts while media loads. Optimize and serve responsive images, preload only genuinely critical assets, minimize blocking resources, and keep third-party scripts to the minimum required for business operations.

Before launch, target Core Web Vitals in the “good” range on representative mobile and desktop pages, zero broken internal links, no mixed content, HTTPS everywhere, valid TLS, secure form handling, spam protection, and a documented backup and rollback path. Review third-party embeds and external links regularly.

### 9. Delivery Phases

**Phase 0 - Discovery and approvals**

- Confirm business goals, audiences, markets, services, legal entity details, and conversion targets.
- Inventory approved brand relationships, office information, images, logos, claims, and contact owners.
- Confirm domain, hosting, email, form destination, analytics policy, and launch authority.

**Phase 1 - Foundation**

- Finalize the homepage information hierarchy and visual system.
- Extract shared styles and scripts only when a second page creates real duplication.
- Establish content naming, asset review, accessibility, and metadata conventions.
- Complete the About, Ecosystem, Brands, Offices, and Contact page content briefs.

**Phase 2 - Build and populate**

- Implement approved pages using the existing templates and `scripts/new-page.py` workflow.
- Move repeatable brand, office, and service data into `content/` where it improves consistency.
- Add approved optimized media, logos, social previews, structured data, and production contact handling.
- Keep navigation, sitemap, canonical URLs, and cross-page links synchronized.

**Phase 3 - Verification**

- Run `python3 scripts/build.py` and resolve all validation failures.
- Test responsive layouts at mobile, tablet, laptop, and wide desktop widths.
- Check keyboard flow, focus visibility, headings, landmarks, form labels, contrast, and reduced motion.
- Validate metadata, structured data, sitemap, `robots.txt`, external links, image dimensions, and missing assets.
- Run performance audits on representative pages with cache-disabled mobile conditions.
- Obtain stakeholder, legal, brand, and technical sign-off.

**Phase 4 - Launch and operate**

- Deploy to staging, run a final content and link review, then promote to production.
- Verify DNS, HTTPS, redirects, forms, email delivery, analytics consent, search indexing, and social previews.
- Monitor uptime, performance, enquiry quality, search visibility, and accessibility issues.
- Review content, partner links, office details, security dependencies, and backups on a defined monthly or quarterly schedule.

### 10. Definition of Done

A page is ready for production when its content and assets are approved, its responsive and keyboard experiences are complete, metadata and structured data are accurate, internal and external links work, no placeholder claims or media remain, the build passes, performance is acceptable, and the relevant business and legal owners have signed off.

## Content Workflow

For a new page, use one command from the repository root:

```bash
python3 scripts/new-page.py insights "Insights" "NEV3S Insights"
python3 scripts/build.py
```

The first command creates `pages/insights.html`, registers it in `content/site.json`, and adds it to homepage navigation. The second command validates all registered pages and regenerates `sitemap.xml`.

For existing content, edit the relevant page or file under `content/`, then run `python3 scripts/build.py`. Add reusable copy or structured data to `content/` rather than duplicating it across pages.

The build fails when a registered page is missing, a required registry section is absent, or duplicate paths/navigation labels exist. This makes navigation and sitemap references auditable before deployment.

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

## Automation Boundary

The system is intentionally dependency-free and deterministic. It does not rewrite authored page content or invent copy; it updates only generated navigation and sitemap output. Shared CSS and JavaScript can be extracted into `styles/` and `scripts/` as the page count grows.

## Publishing Checklist

Before launch, replace any business contact or legal copy that is still provisional, configure a real form submission endpoint, add approved social preview images, and verify every external brand and social link.
