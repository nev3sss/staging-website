#!/usr/bin/env python3
"""Comprehensive NEV3S static-page generator.
Covers every element verified by the full audit of the 10 existing pages:
charset, viewport, description, robots, keywords, title, OG, Twitter,
canonical, favicon, preconnect + fonts, CSS links, JSON-LD schema,
skip-link, full nav (with active state and submenu structure), hero,
content scaffold, footer, site.json integration, sitemap rebuild.
"""

import argparse, json, re, subprocess, sys
from datetime import datetime
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "content" / "site.json"
PAGES_DIR = ROOT / "pages"
SITE_URL = "https://www.nev3s.com/"

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TITLE_MAX = 70
DESC_MIN = 70
DESC_MAX = 165
VALID_SECTIONS = frozenset({"company", "solutions", "top"})
VALID_SCHEMAS = frozenset({"organization", "webpage", "autodealer", "faqpage"})
DEFAULT_KEYWORDS = "NEV3S, EV, electric vehicle, GCC, Saudi Arabia, UAE, automotive"
SECTION_LABEL_MAP = {"company": "Company", "solutions": "Solutions"}

# ------------------------------------------------------------------
# Validation (fail fast, never assume)
# ------------------------------------------------------------------

def bail(msg: str) -> None:
    print(f"ERROR: {msg}")
    sys.exit(1)


def validate_slug(slug: str) -> None:
    if not SLUG_RE.fullmatch(slug):
        bail(f"Slug '{slug}' invalid. Must match ^[a-z0-9]+(?:-[a-z0-9]+)*$ (e.g. insights, ev-market-2025).")
    if slug.startswith("-") or slug.endswith("-"):
        bail(f"Slug '{slug}' must not start/end with hyphen.")


def validate_title(title: str) -> None:
    if not title or not title.strip():
        bail("Title cannot be empty.")
    if len(title) > TITLE_MAX:
        bail(f"Title exceeds {TITLE_MAX} chars ({len(title)} used): {title}")


def validate_description(desc: str) -> None:
    d = desc.strip()
    ln = len(d)
    if ln < DESC_MIN:
        bail(f"Description too short ({ln}, min {DESC_MIN}): {d}")
    if ln > DESC_MAX:
        bail(f"Description exceeds {DESC_MAX} chars ({ln}): {d}")


def validate_files(slug: str, config: dict) -> None:
    page_file = PAGES_DIR / f"{slug}.html"
    if page_file.exists():
        bail(f"File exists: pages/{slug}.html. Delete or choose different slug.")
    reg_path = f"pages/{slug}.html"
    if any(p.get("path") == reg_path for p in config.get("pages", [])):
        bail(f"Path '{reg_path}' already registered in site.json.")


def validate_nav_unique(label: str, config: dict) -> None:
    for item in config.get("navigation", []):
        if item.get("label", "").lower() == label.lower():
            bail(f"Nav label '{label}' already exists (duplicate not allowed).")
        for sub in item.get("items", []):
            if sub.get("label", "").lower() == label.lower():
                bail(f"Nav label '{label}' already exists as sub-item.")

# ------------------------------------------------------------------
# Schema builders (nothing assumed — all 4 types covered)
# ------------------------------------------------------------------

def build_jsonld(args, site_name: str) -> str:
    slug = args.slug
    page_url = f"{SITE_URL}pages/{slug}.html"
    sch = args.schema
    if sch == "organization":
        schema = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": site_name,
            "url": SITE_URL,
            "logo": {"@type": "ImageObject", "url": f"{SITE_URL}assets/logos/logo-horizontal.png"},
            "sameAs": [
                "https://www.linkedin.com/company/nev3s",
                "https://twitter.com/nev3s",
            ],
            "contactPoint": {"@type": "ContactPoint", "contactType": "customer service", "url": f"{SITE_URL}#contact"},
        }
    elif sch == "webpage":
        schema = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": args.title,
            "description": args.description,
            "url": page_url,
            "isPartOf": {"@type": "WebSite", "name": site_name, "url": SITE_URL},
        }
    elif sch == "autodealer":
        schema = {
            "@context": "https://schema.org",
            "@type": "AutoDealer",
            "name": site_name,
            "url": SITE_URL,
            "image": f"{SITE_URL}assets/logos/logo-horizontal.png",
            "priceRange": "$$",
            "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Sunday","Monday","Tuesday","Wednesday","Thursday"], "opens":"08:00","closes":"17:00"}],
            "address": {"@type":"PostalAddress","addressLocality":"Riyadh","addressRegion":"Riyadh Province","addressCountry":"SA"},
            "areaServed": {"@type":"Place","name":"Gulf Cooperation Council (GCC)"},
            "telephone": "+966-11-000-0000",
        }
    elif sch == "faqpage":
        schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type":"Question","name":"What is NEV3S?","acceptedAnswer":{"@type":"Answer","text":"NEV3S is a GCC-wide platform for EV sales, service, aftermarket support, and spare parts coordination across Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman."}},
                {"@type":"Question","name":f"What does {args.title} cover?","acceptedAnswer":{"@type":"Answer","text":args.description}},
            ],
        }
    else:
        schema = {}
    return json.dumps(schema, indent=2, ensure_ascii=False)

# ------------------------------------------------------------------
# Navigation integration (exact match to site.json patterns)
# ------------------------------------------------------------------

def insert_nav(config: dict, args) -> dict:
    cfg = json.loads(json.dumps(config))
    nav = cfg["navigation"]
    item = {"label": args.label, "href": f"pages/{args.slug}.html"}
    section = args.section
    if section in ("company", "solutions"):
        target = SECTION_LABEL_MAP.get(section)
        for it in nav:
            if it.get("label") == target:
                it.setdefault("items", []).append(item)
                break
        else:
            nav.append(item)
    else:
        nav.append(item)
    cfg["pages"].append({"path": f"pages/{args.slug}.html", "label": args.label, "public": args.public})
    return cfg


def build_nav_html(config: dict, active_label: str) -> str:
    lines = []
    for item in config["navigation"]:
        label = item.get("label", "")
        href = item.get("href", "")
        sub_items = item.get("items", [])
        parent_active = label.lower() == active_label.lower()
        if sub_items:
            sub_lines = []
            for sub in sub_items:
                sub_active = sub.get("label", "").lower() == active_label.lower()
                sub_cls = ("nav-link" + (" active" if sub_active else ""))
                sub_lines.append(f'              <a class="{sub_cls}" href="{sub.get("href", "")}">{escape(sub.get("label", ""), quote=False)}</a>')
            parent_cls = "nav-link nav-link--parent" + (" active" if parent_active else "")
            lines.append(
                f'<div class="nav-item has-menu">\n'
                f'  <a class="{parent_cls}" href="{href}">{escape(label, quote=False)}</a>\n'
                f'  <div class="nav-submenu" aria-label="{escape(label, quote=False)} submenu">\n'
                + "\n".join(sub_lines) + "\n"
                f"  </div>\n"
                f"</div>"
            )
        else:
            cls = ("nav-link" + (" active" if parent_active else ""))
            lines.append(f'<a class="{cls}" href="{href}">{escape(label, quote=False)}</a>')
    return "\n        ".join(lines)

# ------------------------------------------------------------------
# Full HTML page (every element audited — nothing assumed)
# ------------------------------------------------------------------

def build_page(args, config: dict) -> str:
    slug = args.slug
    site_name = config.get("site", {}).get("name", "NEV3S")
    site_url = config.get("site", {}).get("url", SITE_URL).rstrip("/")
    title = args.title
    description = args.description
    keywords = args.keywords
    is_public = args.public
    year = datetime.now().year
    page_url = f"{site_url}/pages/{slug}.html"
    jsonld = build_jsonld(args, site_name)
    robots = "index, follow" if is_public else "noindex, nofollow"
    nav_html = build_nav_html(config, args.label)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta
    name="description"
    content="{escape(description, quote=False)}"
  />
  <meta name="robots" content="{robots}" />
  <meta name="keywords" content="{escape(keywords, quote=False)}" />
  <title>{escape(title, quote=False)} | {site_name}</title>
  <meta property="og:title" content="{escape(title, quote=False)} | {site_name}" />
  <meta property="og:description" content="{escape(description, quote=False)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{page_url}" />
  <meta property="og:image" content="{site_url}/assets/images/og-default.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{escape(title, quote=False)} | {site_name}" />
  <meta name="twitter:description" content="{escape(description, quote=False)}" />
  <link rel="canonical" href="{page_url}" />
  <link rel="icon" href="../assets/icons/favicon.ico" sizes="any" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="../styles/page-shell.css" />
  <link rel="stylesheet" href="../styles/brands.css" />
  <script type="application/ld+json">
{jsonld}
  </script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header class="site-header">
    <div class="container nav">
      <a href="../index.html" class="logo-shell" aria-label="{site_name} home">
        <img
          class="logo"
          src="../assets/logos/logo-horizontal.png"
          alt="{site_name} logo"
          width="220"
          height="62"
        />
      </a>
      <nav class="nav-links" aria-label="Main navigation">
        {nav_html}
      </nav>
    </div>
  </header>

  <main id="main-content">
    <section class="hero" aria-labelledby="page-title">
      <div class="container">
        <p class="eyebrow">{site_name}</p>
        <h1 id="page-title">{escape(title, quote=False)}</h1>
        <p>{escape(description, quote=False)}</p>
      </div>
    </section>

    <section class="page-section">
      <div class="container">
        <div class="section-intro">
          <h2>Overview</h2>
          <p>
            Replace this placeholder with your page content. Use the card-grid,
            split-layout, stats, and step-flow patterns from page-shell.css.
            Keep headings semantic: h2 for section, h3 for cards.
          </p>
        </div>
        <div class="card-grid">
          <article class="feature-card">
            <span class="tag">Topic</span>
            <h3>Content heading</h3>
            <p>Replace with your first content block.</p>
          </article>
          <article class="feature-card">
            <span class="tag">Topic</span>
            <h3>Content heading</h3>
            <p>Add a second point matching the first structure.</p>
          </article>
          <article class="feature-card">
            <span class="tag">Topic</span>
            <h3>Content heading</h3>
            <p>Complete the row with a third focused item.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="cta-band" aria-label="Next step">
      <div class="container">
        <div class="cta-inner">
          <div>
            <h2>Get in touch with {site_name}</h2>
            <p>Contact our team to discuss your GCC EV goals.</p>
          </div>
          <a class="button primary" href="../index.html#contact">Contact {site_name}</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; {year} {site_name}. All rights reserved.</p>
      <nav class="footer-links" aria-label="Footer navigation">
        <a href="../index.html">Home</a>
        <a href="brands.html">Brands</a>
        <a href="../index.html#faq">FAQ</a>
        <a href="../index.html#contact">Contact</a>
      </nav>
    </div>
  </footer>
</body>
</html>
"""

# ------------------------------------------------------------------
# CLI
# ------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="Generate a fully-formed NEV3S static page.")
    p.add_argument("slug", help="URL slug, e.g. insights")
    p.add_argument("label", help="Navigation label, e.g. Insights")
    p.add_argument("--title", required=True, help=f"Page title (max {TITLE_MAX})")
    p.add_argument("--description", required=True, help=f"Meta description ({DESC_MIN}-{DESC_MAX} chars)")
    p.add_argument("--section", choices=sorted(VALID_SECTIONS), default="top",
                   help="Nav placement (default: top-level after Brands)")
    p.add_argument("--schema", choices=sorted(VALID_SCHEMAS), default="organization",
                   help="JSON-LD schema (default: organization)")
    p.add_argument("--keywords", default=DEFAULT_KEYWORDS, help="Comma-separated keywords")
    group = p.add_mutually_exclusive_group()
    group.add_argument("--public", action="store_true", default=True, dest="public",
                       help="Public page (default)")
    group.add_argument("--private", action="store_true",
                       help="Private (noindex, excluded from sitemap)")
    p.add_argument("--dry-run", action="store_true", help="Preview only")
    p.add_argument("--no-build", action="store_true", help="Skip build.py after creation")
    return p.parse_args()


def dry_run(args, config: dict) -> None:
    html = build_page(args, config)
    banner = f"\n{'='*70}\n  DRY RUN — pages/{args.slug}.html (would be created)\n{'='*70}\n"
    footer = f"\n{'='*70}\n  DRY RUN — site.json (navigation + pages)\n  --section={args.section} label={args.label}\n  public={args.public} schema={args.schema}\n  build.py skipped (--dry-run)\n{'='*70}\n"
    print(banner)
    print(html)
    print(footer)


def main() -> None:
    args = parse_args()
    try:
        with CONFIG_PATH.open(encoding="utf-8") as f:
            config = json.load(f)
    except FileNotFoundError:
        bail(f"content/site.json missing at {CONFIG_PATH}")
    except json.JSONDecodeError as exc:
        bail(f"site.json invalid JSON: {exc}")

    # All checks before any writes
    validate_slug(args.slug)
    validate_title(args.title)
    validate_description(args.description)
    if args.section not in VALID_SECTIONS:
        bail(f"Invalid --section '{args.section}'")
    if args.schema not in VALID_SCHEMAS:
        bail(f"Invalid --schema '{args.schema}'")
    validate_files(args.slug, config)
    validate_nav_unique(args.label, config)

    if args.dry_run:
        dry_run(args, config)
        return

    # Write page
    page_path = PAGES_DIR / f"{args.slug}.html"
    try:
        page_path.write_text(build_page(args, config), encoding="utf-8")
    except Exception as exc:
        bail(f"Failed writing {page_path}: {exc}")

    # Update site.json
    updated = insert_nav(config, args)
    try:
        CONFIG_PATH.write_text(json.dumps(updated, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except Exception as exc:
        # Offer cleanup if site.json write fails after file exists
        print(f"\nWARNING: page written but site.json update failed ({exc}).")
        print(f"  Remove orphan: del {page_path}")
        sys.exit(1)

    print(f"\nSUCCESS: pages/{args.slug}.html created and registered.")
    print(f"  Title: {args.title}")
    print(f"  Label: {args.label}  Section: {args.section}")
    print(f"  Schema: {args.schema}  Public: {args.public}")
    print(f"  Description length: {len(args.description)} chars (target {DESC_MIN}-{DESC_MAX})")
    print(f"\nNext: edit {page_path}, then run 'py scripts/build.py'.")
    if not args.no_build:
        try:
            res = subprocess.run(["python", str(ROOT / "scripts" / "build.py")],
                                 cwd=str(ROOT), capture_output=True, text=True, timeout=60)
            print(res.stdout.strip() if res.returncode == 0 else f"Build exit {res.returncode}\n{res.stderr}")
        except Exception as exc:
            print(f"Build skipped/failed: {exc}")


if __name__ == "__main__":
    main()
