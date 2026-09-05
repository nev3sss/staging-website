#!/usr/bin/env python3
"""Validate the content registry and update generated homepage navigation."""

import json
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


def write_sitemap(config):
    from datetime import date
    today = date.today().isoformat()
    urls = []
    for page in config["pages"]:
        if page.get("public"):
            path = page["path"].replace("index.html", "")
            urls.append(
                f'  <url><loc>{escape(config["site"]["url"] + path)}</loc>'
                f'<lastmod>{today}</lastmod></url>'
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
    print(f"Validated {len(config['pages'])} registered pages and generated sitemap.xml")


if __name__ == "__main__":
    main()
