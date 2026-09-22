#!/usr/bin/env python3
"""Validate the content registry, update generated homepage navigation, and check accessibility."""

import json
import re
import subprocess
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "content" / "site.json"
INDEX_PATH = ROOT / "index.html"
SITEMAP_PATH = ROOT / "sitemap.xml"


def load_config():
    with CONFIG_PATH.open(encoding="utf-8") as stream:
        return json.load(stream)


def render_nav_item(item, class_name):
    safe_label = escape(item["label"], quote=False)
    if "items" in item and item["items"]:
        children = "\n".join(
            f'    <a href="{escape(child["href"], quote=True)}" class="{class_name} nav-link--child">{escape(child["label"], quote=False)}</a>'
            for child in item["items"]
        )
        return (
            '<div class="nav-item has-menu">\n'
            f'  <a href="{escape(item["href"], quote=True)}" class="{class_name} nav-link--parent">{safe_label}</a>\n'
            '  <div class="nav-submenu">\n'
            f'{children}\n'
            '  </div>\n'
            '</div>'
        )
    return f'<a href="{escape(item["href"], quote=True)}" class="{class_name}">{safe_label}</a>'


def render_links(items, class_name):
    return "\n".join(render_nav_item(item, class_name) for item in items)


def replace_block(source, start, end, content):
    marker_index = source.index(start)
    start_index = marker_index + len(start)
    end_index = source.index(end, start_index)
    line_start = source.rfind("\n", 0, marker_index) + 1
    indentation = source[line_start:marker_index]
    content = "\n".join(indentation + line for line in content.splitlines())
    return source[:start_index] + "\n" + content + "\n" + indentation + source[end_index:]


def update_homepage(config):
    with INDEX_PATH.open(encoding="utf-8") as f:
        source = f.read()
    navigation = render_links(config["navigation"], "nav-link")
    source = replace_block(source, "<!-- GENERATED:NAV-START -->", "<!-- GENERATED:NAV-END -->", navigation)
    with INDEX_PATH.open("w", encoding="utf-8") as f:
        f.write(source)
    subprocess.run(["npx.cmd" if subprocess.os.name == "nt" else "npx", "prettier", "--write", str(INDEX_PATH)], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)


def validate_pages(config):
    missing = [page["path"] for page in config["pages"] if not (ROOT / page["path"]).is_file()]
    if missing:
        raise SystemExit("Missing registered pages: " + ", ".join(missing))
    paths = [page["path"] for page in config["pages"]]
    if len(paths) != len(set(paths)):
        raise SystemExit("Duplicate page paths found in content/site.json")
    labels = [item["label"] for item in config["navigation"]]
    if len(labels) != len(set(labels)):
        raise SystemExit("Duplicate navigation labels found in content/site.json")


# ---------------------------------------------------------------------------
# Accessibility validation
# ---------------------------------------------------------------------------

def validate_accessibility():
    """Check all HTML pages for common accessibility issues."""
    issues = []

    html_files = [INDEX_PATH]
    for page in load_config()["pages"]:
        html_files.append(ROOT / page["path"])

    for html_file in html_files:
        if not html_file.is_file():
            continue
        source = html_file.read_text(encoding="utf-8")

        # Check for <html lang="..."> attribute
        if not re.search(r'<html\s+[^>]*lang\s*=', source, re.IGNORECASE):
            issues.append(f"{html_file.name}: missing lang attribute on <html>")

        # Check all <img> tags have alt attributes
        for match in re.finditer(r'<img\s[^>]*>', source, re.IGNORECASE):
            tag = match.group(0)
            if not re.search(r'\balt\s*=', tag, re.IGNORECASE):
                issues.append(f"{html_file.name}: <img> tag missing alt attribute: {tag[:80]}")

        # Check for skip-link
        if "skip-link" not in source and "skip to main" not in source.lower():
            issues.append(f"{html_file.name}: no skip-to-main-content link found")

        # Check for <main> element
        if not re.search(r'<main\b', source, re.IGNORECASE):
            issues.append(f"{html_file.name}: no <main> element found")

        # Check images have explicit width/height (CLS prevention)
        for match in re.finditer(r'<img\s[^>]*>', source, re.IGNORECASE):
            tag = match.group(0)
            if not re.search(r'\bwidth\s*=', tag, re.IGNORECASE):
                issues.append(f"{html_file.name}: <img> missing width attribute (CLS): {tag[:80]}")
            if not re.search(r'\bheight\s*=', tag, re.IGNORECASE):
                issues.append(f"{html_file.name}: <img> missing height attribute (CLS): {tag[:80]}")

        # Check for loading="lazy" on non-critical images
        # Images in the hero/above-the-fold should NOT have lazy loading
        # Images below the fold should have loading="lazy"
        img_tags = list(re.finditer(r'<img\s[^>]*>', source, re.IGNORECASE))
        for match in img_tags:
            tag = match.group(0)
            # Check if image has loading attribute at all
            has_loading = re.search(r'\bloading\s*=\s*["\']?(\w+)', tag, re.IGNORECASE)
            # Flag images without loading attribute (except those in <head> like og:image meta)
            # Only check <img> tags in body, not meta tags
            if not has_loading:
                issues.append(f"{html_file.name}: <img> missing loading attribute: {tag[:80]}")

        # Check <iframe> elements have title attribute
        for match in re.finditer(r'<iframe\s[^>]*>', source, re.IGNORECASE):
            tag = match.group(0)
            if not re.search(r'\btitle\s*=', tag, re.IGNORECASE):
                issues.append(f"{html_file.name}: <iframe> missing title attribute: {tag[:80]}")

        # Check <button> elements have accessible text (aria-label or text content)
        for match in re.finditer(r'<button\s[^>]*>(.*?)</button>', source, re.IGNORECASE | re.DOTALL):
            attrs = match.group(0)
            content = match.group(1).strip()
            has_aria_label = re.search(r'\baria-label\s*=', attrs, re.IGNORECASE)
            has_aria_labelledby = re.search(r'\baria-labelledby\s*=', attrs, re.IGNORECASE)
            if not content and not has_aria_label and not has_aria_labelledby:
                issues.append(f"{html_file.name}: <button> without accessible name: {attrs[:80]}")

        # Check <a> tags with only icon content have aria-label
        for match in re.finditer(r'<a\s[^>]*>(.*?)</a>', source, re.IGNORECASE | re.DOTALL):
            attrs = match.group(0)
            content = match.group(1).strip()
            # If link content is empty or only whitespace/icons
            if not content or re.match(r'^[\s►←→↓↑▾✓×✘]+$', content):
                has_aria_label = re.search(r'\baria-label\s*=', attrs, re.IGNORECASE)
                if not has_aria_label:
                    issues.append(f"{html_file.name}: <a> without text content or aria-label: {attrs[:80]}")

        # Check for viewport meta tag
        if not re.search(r'<meta\s+name\s*=\s*["\']viewport["\']', source, re.IGNORECASE):
            issues.append(f"{html_file.name}: missing viewport meta tag")

        # Check form inputs have associated labels
        for match in re.finditer(r'<(?:input|select|textarea)\s[^>]*>', source, re.IGNORECASE):
            tag = match.group(0)
            tag_id = re.search(r'\bid\s*=\s*["\']([^"\']+)["\']', tag, re.IGNORECASE)
            has_aria_label = re.search(r'\baria-label\s*=', tag, re.IGNORECASE)
            has_aria_labelledby = re.search(r'\baria-labelledby\s*=', tag, re.IGNORECASE)
            # Check if there's a <label for="..."> pointing to this input
            # or if the input is wrapped inside a <label> element
            if tag_id and not has_aria_label and not has_aria_labelledby:
                input_id = tag_id.group(1)
                # Search for associated label via for attribute
                label_pattern = rf'<label\s[^>]*for\s*=\s*["\']?{re.escape(input_id)}["\']?'
                # Search for wrapping <label> element containing this input
                wrap_pattern = rf'<label\s[^>]*>\s*(?:<span\s[^>]*>)*\s*<(?:input|select|textarea)\s[^>]*id\s*=\s*["\']?{re.escape(input_id)}'
                if not re.search(label_pattern, source, re.IGNORECASE) and not re.search(wrap_pattern, source, re.IGNORECASE):
                    issues.append(f"{html_file.name}: form input id='{input_id}' has no associated <label for> or wrapping <label>")

    if issues:
        print("\n⚠️  Accessibility warnings:")
        for issue in issues:
            print(f"  • {issue}")
        print(f"\nTotal accessibility warnings: {len(issues)}")
    else:
        print("✅ Accessibility validation passed — no issues found.")

    return issues


def write_sitemap(config):
    from datetime import date
    today = date.today().isoformat()
    priority_map = {
        "index.html": "1.0",
    }
    freq_map = {
        "index.html": "weekly",
        "pages/brands.html": "weekly",
    }
    urls = []
    for page in config["pages"]:
        if page.get("public"):
            path = page["path"].replace("index.html", "")
            loc = escape(config["site"]["url"] + path)
            priority = priority_map.get(page["path"], "0.8")
            freq = freq_map.get(page["path"], "monthly")
            if "policy" in page["path"]:
                priority = "0.3"
                freq = "yearly"
            urls.append(
                f"  <url><loc>{loc}</loc><lastmod>{today}</lastmod>"
                f"<changefreq>{freq}</changefreq><priority>{priority}</priority></url>"
            )
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "\n".join(urls) + "\n</urlset>\n"
    SITEMAP_PATH.write_text(sitemap, encoding="utf-8")


def main():
    config = load_config()
    required = {"site", "navigation", "pages"}
    if not required.issubset(config):
        raise SystemExit("content/site.json must define site, navigation, and pages")
    validate_pages(config)
    update_homepage(config)
    write_sitemap(config)
    validate_accessibility()
    print(f"Validated {len(config['pages'])} registered pages and generated sitemap.xml")


if __name__ == "__main__":
    main()
