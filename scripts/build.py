#!/usr/bin/env python3
"""Validate the content registry and update generated homepage navigation."""

import json
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "content" / "site.json"
INDEX_PATH = ROOT / "index.html"
SITEMAP_PATH = ROOT / "sitemap.xml"


def load_config():
    with CONFIG_PATH.open(encoding="utf-8") as stream:
        return json.load(stream)


def render_links(items, class_name):
    return "\n".join(
        f'        <a href="{item["href"]}" class="{class_name}">{item["label"]}</a>'
        for item in items
    )


def replace_block(source, start, end, content):
    start_index = source.index(start) + len(start)
    end_index = source.index(end, start_index)
    return source[:start_index] + "\n" + content + "\n      " + source[end_index:]


def update_homepage(config):
    source = INDEX_PATH.read_text(encoding="utf-8")
    navigation = render_links(config["navigation"], "nav-link")
    source = replace_block(source, "      <!-- GENERATED:NAV-START -->", "<!-- GENERATED:NAV-END -->", navigation)
    INDEX_PATH.write_text(source, encoding="utf-8")


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
    urls = []
    for page in config["pages"]:
        if page.get("public"):
            path = page["path"].replace("index.html", "")
            urls.append(f'  <url><loc>{escape(config["site"]["url"] + path)}</loc></url>')
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
