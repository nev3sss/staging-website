# NEV3S Business Registrations — Implementation Plan

> **Repo:** `nev3sss/staging-website` (this repo — static HTML, Python build scripts)
> **Scope:** Static marketing page + dealer signup form (both in this repo)
> **External dependency:** A separate Cloudflare Worker (built by another window) receives the form's `fetch()` POST
> **Audience:** B2B GCC EV dealers, importers, distributors
> **Plan date:** 2026-09-02
> **UBI:** Informational only — skip for now

---

## Context

NEV3S Marketplace launches Jan 1, 2027. Before dealers can list inventory on the marketplace, they must register their business and pass NEV3S verification (trade licence review, brand authorization, identity checks).

This plan covers **everything that lives inside this `staging-website` repo**:

1. A **public marketing/info page** at `pages/business-registrations.html` that explains the program, lists required documents, shows dealer tiers, and answers FAQs.
2. A **signup form** (on the same page) that dealers fill out to apply. The form submits via `fetch()` to a Cloudflare Worker endpoint.

The Worker (which receives the form, validates, writes to D1, sends email) is built and deployed **separately** by another window. We do not own that code here. We only need the Worker URL to wire up the form's `fetch()`.

---

## Architecture

```
┌─────────────────────────────────────┐
│  staging-website (this repo)        │
│                                     │
│  pages/                             │
│  ├── business-registrations.html    │  ← marketing + form
│  ├── business-registrations-ar.html  │  ← Arabic (optional, v2)
│                                     │
│  scripts/dealers/                   │
│  ├── form-validation.js             │  ← client-side validation
│  ├── submit-to-worker.js            │  ← fetch() to Worker URL
│  └── config.js                      │  ← WORKER_URL constant
│                                     │
│  styles/                            │
│  ├── brands.css (base)              │
│  └── dealers.css (overrides)        │
│                                     │
│  docs/email-templates/              │  ← 8 email templates (markdown)
│  content/site.json                  │  ← register new pages
└──────────────┬──────────────────────┘
               │  fetch(POST, body)
               ▼
┌─────────────────────────────────────┐
│  Cloudflare Worker (external)       │
│  Built by another window.           │
│  Endpoint TBD — ask other window.   │
│                                     │
│  • Validates server-side            │
│  • Writes to D1 (applications)      │
│  • Stores docs in R2                │
│  • Triggers Email 1 (Resend/etc)    │
│  • Returns { application_id }       │
└─────────────────────────────────────┘
```

**Critical integration point:** The `WORKER_URL` constant in `scripts/dealers/config.js`. When the other window has the Worker deployed, we drop the URL in. Until then, the form can be wired to a placeholder (logs to console, or 501 Not Implemented).

---

## 1. Page Structure

**Primary file:** `pages/business-registrations.html`
**URL:** `https://www.nev3s.com/pages/business-registrations.html`

**Navigation placement:** Top-level nav link after **Marketplace**. Mirrors the marketplace page's dealer-first priority.

**Sections (in order):**

| # | Section | Purpose |
|---|---------|---------|
| 1 | Hero | Dark, dramatic. Headline, sub-headline, 4-stat trust strip, CTA → scrolls to form |
| 2 | Why Register | 6 benefits of becoming a verified NEV3S dealer |
| 3 | Registration Steps | 4-step visual process (Apply → Review → Approve → List) |
| 4 | **Application Form** | The actual `<form>` — fields below in §4 |
| 5 | Required Documents | B2B checklist: trade licence, authorization, identity docs |
| 6 | Dealer Tiers | Authorised / Importer / Independent — what each tier unlocks |
| 7 | Comparison Table | NEV3S Verified Dealer vs. Generic Listing — 8 rows |
| 8 | FAQ | 6–8 questions about the process, timelines, costs |
| 9 | CTA Block | Highlighted dark box — fallback contact (until Worker is live) |

---

## 2. Content Outline (Marketing Sections)

### 2a. Hero
- **Eyebrow:** `Dealership Verification — GCC EV Marketplace`
- **H1:** `Become a Verified GCC EV Dealer`
- **Sub:** NEV3S is the GCC's first EV automotive ecosystem. Before your first listing goes live, we verify your business, validate your credentials, and issue your dealer profile — so buyers know exactly who they're dealing with.
- **4-stat strip:** 6 GCC Markets | 100% BEV | Jan 1 2027 Launch | All Brands Welcome
- **Primary CTA:** `Apply Now` (anchor jumps to `#apply`)
- **Secondary CTA:** `View Marketplace`

### 2b. Why Register (6-card grid)
1. **Trust Verification** — every dealer reviewed before going live; verified badges shown to buyers.
2. **Marketplace Access** — list inventory on the GCC's first dedicated EV marketplace.
3. **AI Pricing Intelligence** — real-time GCC market pricing tools.
4. **Escrow Transaction Protection** — no outstanding invoices; no disputes after delivery.
5. **Cross-GCC Reach** — one profile, six markets (KSA, UAE, Qatar, Kuwait, Bahrain, Oman).
6. **Service Network Integration** — link to NEV3S GCC-wide service network.

### 2c. Registration Steps (4-step flow)
1. **Submit Application** — fill the form below (~10 minutes).
2. **Upload Documents** — trade licence, authorization letter, primary contact ID.
3. **NEV3S Review** — most applications reviewed within 5 business days.
4. **Get Verified & List** — dealer profile goes live; start listing verified EVs.

### 2d. Required Documents (Section 5 — between Form and Tiers)
**All applicants must provide:**
- Trade licence (PDF/JPG/PNG, max 10MB)
- Primary contact government-issued ID (passport, national ID, or driving licence)
- Business email and GCC phone number verification

**Authorised distributors / importers must also provide:**
- Official authorization letter from OEM
- Distributor agreement or certificate of appointment
- Customs/import clearance evidence (if applicable)

### 2e. Dealer Tiers (Section 6)
3-column tier comparison:
- **Independent Dealer** — grey `#6f6f6f` top border
- **Importer / Trader** — blue-grey `#4a5568` top border
- **Authorised Distributor** — red `#d30100` top border

### 2f. Comparison Table (Section 7)
8 rows matching the marketplace page's `.comparison-table` style:
NEV3S Verified Dealer vs. Generic Listing Platform

### 2g. FAQ (Section 8)
6–8 questions — approval time, cost, reapply rules, GCC coverage, brand eligibility.

### 2h. CTA Block (Section 9)
Dark highlight box — until Worker is live, this shows a "Coming soon — register interest via `#contact`" message. Once Worker is live, the form below takes over.

---

## 3. Site Integration

### 3a. Navigation — `content/site.json`
Add to `navigation` array (after Marketplace):

```json
{
  "label": "Business Registrations",
  "href": "pages/business-registrations.html"
}
```

Add to `pages` array:

```json
{
  "path": "pages/business-registrations.html",
  "label": "Business Registrations",
  "public": true
}
```

### 3b. Navigation HTML — `pages/business-registrations.html`
Update `<nav class="nav-links">` to add the new link, matching the marketplace page's pattern (line 708).

### 3c. Cross-link from `pages/marketplace.html`
Add "Are you a dealer? Register your business →" link in the marketplace CTA section.

### 3d. Footer
Add `Business Registrations` to the footer link list on all pages (matching the marketplace footer pattern, line 1213).

---

## 4. Form Specification (the `<form>` on the page)

### 4a. Form Fields (B2B / Dealer only — no B2C in this phase)

Required fields, grouped into 5 fieldset sections:

**Section A — Business Identity**
- `legal_company_name` (text, required)
- `trading_name` (text, required)
- `business_type` (select: sole_proprietorship / llc / partnership / corporation)
- `gcc_country` (select: SA / AE / QA / KW / BH / OM)
- `city` (text, required)
- `registered_address` (textarea, required)
- `showroom_address` (textarea, optional)
- `trade_licence_number` (text, required)
- `trade_licence_authority` (text, required)
- `trade_licence_issue_date` (date, required)
- `trade_licence_expiry_date` (date, required)

**Section B — Primary Contact**
- `contact_name` (text, required)
- `contact_position` (text, required)
- `contact_email` (email, required, verified via email OTP later — for now just regex-validated)
- `contact_phone` (tel, required, GCC format)

**Section C — EV Capability**
- `ev_brands` (text + tags, required — comma-separated or tag input)
- `relationship_type` (radio: authorised / independent / importer, required)
- `inventory_type` (checkbox: new / pre_owned, at least one required)
- `ev_speciality` (textarea, optional — describe EV capability, charging, high-voltage certified techs)

**Section D — Documents (file uploads)**
- `trade_licence_file` (file, required, PDF/JPG/PNG, max 10MB)
- `authorization_file` (file, conditional — required if `relationship_type === 'authorised'`)
- `contact_id_file` (file, required, PDF/JPG/PNG, max 10MB)

**Section E — Consents**
- `accepts_dealer_terms` (checkbox, required)
- `accuracy_declaration` (checkbox, required)

### 4b. Form Submission Flow

1. **Client-side validation** (instant feedback, blocks submit) — `form-validation.js`
2. **Submit handler** — `submit-to-worker.js`:
   - Build `FormData` (or JSON — coordinate with other window on shape)
   - `fetch(WORKER_URL, { method: 'POST', body })`
   - Show loading spinner during request
   - On success: show success state with `application_id`, scroll to top, hide form
   - On error: show error message inline, retain form data
3. **Anti-bot:** If the other window provides a Turnstile site key, render `<div class="cf-turnstile">` before submit. If not yet, skip.

### 4c. Form State UI
- **Idle:** form visible, submit button enabled
- **Submitting:** button disabled, spinner shown
- **Success:** form replaced with success panel — "Application received. Reference: {application_id}. You'll hear from NEV3S within 5 business days."
- **Error:** inline error banner above form, fields preserved, submit re-enabled

### 4d. Client-side validation rules
- Email regex (RFC 5322 simplified)
- GCC phone regex (per-country)
- Date sanity (issue_date < expiry_date, issue_date not in future)
- File type allowlist (PDF, JPG, JPEG, PNG)
- File size (10MB max per file)
- All required fields filled

---

## 5. CSS Strategy

**Base:** `styles/brands.css` (same as marketplace page)  
**Overrides:** Scoped `<style>` block inside the page, PLUS optional `styles/dealers.css` if overrides grow large.

Custom classes:
- `.reg-hero` — dark hero with red radial glow
- `.trust-strip` — 4-stat row
- `.dealer-tiers` — 3-column grid
- `.dealer-tier-card` — color-coded top border
- `.docs-checklist` — two-column requirements list
- `.trust-signals-grid` — 3-col grid
- `.highlight-box` — dark CTA box (reuse from marketplace)
- `.reg-form` — form container
- `.form-fieldset` — fieldset grouping
- `.form-row` — 2-col field row
- `.form-success` — success state panel
- `.form-error` — inline error banner

Color tokens (already in brands.css):
- `--red: #d30100`
- `--ink: #171717`
- `--paper: #f7f5f2`
- `--white: #fff`

---

## 6. JavaScript Strategy

### 6a. `scripts/dealers/config.js`
Single source of truth for the Worker endpoint:
```js
export const WORKER_URL = 'https://PLACEHOLDER.workers.dev/api/v1/dealer-applications';
export const TURNSTILE_SITE_KEY = null;  // empty until other window provides
```
When other window supplies the URL, update this one file. Page re-deploy picks it up.

### 6b. `scripts/dealers/form-validation.js`
- Listen on `submit` event
- Validate each field per rules in §4d
- Show inline error messages under each invalid field
- Block submit if any errors
- Clear errors as user fixes them

### 6c. `scripts/dealers/submit-to-worker.js`
- Build payload from form data
- Call `fetch(WORKER_URL, ...)` with method POST
- Handle response: success → show success panel; error → show error banner
- Loading state management

### 6d. Loading
- Pages load `config.js` first, then `form-validation.js`, then `submit-to-worker.js`
- Use `<script type="module">` for ES module imports

---

## 7. File Changes

| Action | File |
|--------|------|
| **CREATE** | `pages/business-registrations.html` |
| **CREATE** | `scripts/dealers/config.js` |
| **CREATE** | `scripts/dealers/form-validation.js` |
| **CREATE** | `scripts/dealers/submit-to-worker.js` |
| **CREATE** | `styles/dealers.css` (if overrides grow) |
| **CREATE** | `docs/email-templates/` (8 markdown files for designer/copy review) |
| **EDIT** | `content/site.json` — add nav + pages entries |
| **EDIT** | `pages/marketplace.html` — add dealer cross-link |
| **EDIT** | All page footers — add Business Registrations link |
| **RUN** | `py scripts/build.py` — validate + sitemap |

---

## 8. Worker Integration Checklist

Items we need from the other window (the Cloudflare Worker owner):

- [ ] **Worker URL** (production endpoint) — drop into `config.js`
- [ ] **Request shape** — JSON or `FormData`? Field names matching the form spec in §4a?
- [ ] **Response shape** — `{ success: true, data: { application_id } }` or different?
- [ ] **Turnstile site key** — if anti-bot widget will be embedded
- [ ] **Error response codes** — what does 4xx look like? Field-level errors?
- [ ] **File upload mechanism** — does the form POST files directly to Worker, or do we presign to R2 first?

Until these are confirmed, the form uses a **placeholder Worker URL** and a `console.log()` of the form payload. The page is otherwise fully built and reviewable.

---

## 9. Build & Verification

```bash
# 1. Create feature branch
cd C:\Users\nev3s\Documents\Gh-nev3sss\staging-website
git switch -c feature/business-registrations

# 2. Create files (manual or via Write tool)

# 3. Update content/site.json

# 4. Run build
py scripts/build.py

# 5. Local preview
py -m http.server 4173
# Open http://localhost:4173/pages/business-registrations.html

# 6. Manual checks
# - Page renders with hero, form, comparison, FAQ
# - Form validation works (try empty submit)
# - Form submission shows loading → success/error states
# - Nav shows "Business Registrations" link
# - sitemap.xml includes the new page
# - Mobile (320px), tablet (768px), desktop (1200px)
```

---

## 10. Out of Scope

- Worker code, D1 schema, R2 storage (other window)
- Admin review dashboard (other window)
- Email-sending logic (other window — but the templates live here as docs for review)
- B2C private-seller flow
- Live Turnstile integration (until site key provided)
- Authenticated dealer dashboard (separate page, post-MVP)
- Arabic version (`-ar.html` — defer to v2)
- UBI generation

---

## 11. Success Criteria

The feature is complete when:
1. `pages/business-registrations.html` exists with all 9 sections including a working `<form>`
2. `content/site.json` has nav + pages entries
3. `py scripts/build.py` passes; `sitemap.xml` includes the new page
4. Form validation works in browser (empty submit shows errors)
5. Form submission attempts the Worker `fetch()` (with placeholder URL until other window is ready)
6. Success and error states render correctly (testable with mock responses)
7. Page is responsive at 320px, 768px, 1200px
8. No console errors, no broken images, no broken links
9. Design matches NEV3S brand tokens (red, ink, paper, Poppins, Inter, JetBrains Mono)
10. `WORKER_URL` placeholder is the only integration point — when other window provides the URL, the form goes live with no code changes
