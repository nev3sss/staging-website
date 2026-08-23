#!/usr/bin/env python3
"""Create and register a new static page in one command."""

import argparse
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "content" / "site.json"


def parse_args():
    parser = argparse.ArgumentParser(description="Create and register a NEV3S content page")
    parser.add_argument("slug", help="URL-safe page slug, for example insights")
    parser.add_argument("label", help="Navigation label, for example Insights")
    parser.add_argument("title", help="Page title")
    return parser.parse_args()


def main():
    args = parse_args()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.slug):
        raise SystemExit("Slug must use lowercase letters, numbers, and hyphens only")

    page_path = ROOT / "pages" / f"{args.slug}.html"
    if page_path.exists():
        raise SystemExit(f"Page already exists: {page_path.relative_to(ROOT)}")

    page_path.write_text(
        f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape(args.title)} | NEV3S</title>
  <meta name="description" content="{escape(args.title)} - NEV3S">
</head>
<body>
  <header>
    <a href="../index.html" aria-label="NEV3S home">NEV3S</a>
  </header>
  <main>
    <h1>{escape(args.title)}</h1>
    <p>Page content goes here.</p>
  </main>
</body>
</html>
''',
        encoding="utf-8",
    )

    with CONFIG_PATH.open(encoding="utf-8") as stream:
        config = json.load(stream)
    config["navigation"].append({"label": args.label, "href": f"pages/{args.slug}.html"})
    config["pages"].append({"path": f"pages/{args.slug}.html", "label": args.label, "public": True})
    CONFIG_PATH.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    print(f"Created and registered pages/{args.slug}.html. Run python3 scripts/build.py next.")


if __name__ == "__main__":
    main()
