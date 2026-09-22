#!/usr/bin/env python3
"""link-checker.py — audit all links on nev3s.com and check accessibility of link text."""
import os
import re
import sys
from urllib.parse import urljoin, urlparse
from collections import deque

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("This script requires 'requests' and 'beautifulsoup4'.")
    print("Install with: pip install requests beautifulsoup4")
    sys.exit(1)

BASE = "https://nev3s.com"
START_PATH = ""  # root
TIMEOUT = 10
SKIP_PREFIXES = ("mailto:", "tel:", "javascript:", "#")
SKIP_DOMAINS = {"twitter.com", "facebook.com", "instagram.com",
                "linkedin.com", "youtube.com", "wa.me", "wa.link"}

visited = set()
broken = []
external_checked = {}
a11y_issues = []


def is_internal(url):
    p = urlparse(url)
    if not p.netloc:
        return True
    return p.netloc in ("nev3s.com", "www.nev3s.com")


def status(url, internal):
    try:
        r = requests.head(url, timeout=TIMEOUT, allow_redirects=True,
                          headers={"User-Agent": "NEV3S LinkChecker/1.0"})
        return r.status_code
    except requests.RequestException as e:
        return f"ERROR: {e}"


def check_link_accessibility(soup, page_url):
    """Check links for accessibility issues."""
    for tag in soup.find_all("a", href=True):
        href = tag["href"].strip()
        text = tag.get_text(strip=True)

        # Check for link text (empty or icon-only links need aria-label)
        if not text:
            has_aria_label = tag.get("aria-label")
            has_aria_labelledby = tag.get("aria-labelledby")
            has_title = tag.get("title")
            if not has_aria_label and not has_aria_labelledby and not has_title:
                a11y_issues.append({
                    "page": page_url,
                    "issue": f"Empty link text without aria-label: href='{href}'"
                })

        # Check for rel="noopener" on target="_blank" links
        if tag.get("target") == "_blank":
            rel = tag.get("rel", [])
            if isinstance(rel, str):
                rel = rel.split()
            if "noopener" not in rel:
                a11y_issues.append({
                    "page": page_url,
                    "issue": f"External link (target=_blank) missing rel='noopener': href='{href}'"
                })


def crawl(start_url):
    queue = deque([start_url])
    while queue:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)
        print(f"  Checking: {url}", flush=True)
        try:
            r = requests.get(url, timeout=TIMEOUT)
            soup = BeautifulSoup(r.text, "html.parser")

            # Accessibility check on links
            check_link_accessibility(soup, url)

            for tag in soup.find_all("a", href=True):
                href = tag["href"].strip()
                if any(href.startswith(p) for p in SKIP_PREFIXES):
                    continue
                full = urljoin(url, href)
                frag = urlparse(full)
                canonical = f"{frag.scheme}://{frag.netloc}{frag.path}"
                if frag.fragment:
                    # anchor-only link
                    if canonical in visited:
                        continue
                if is_internal(canonical) and canonical not in visited:
                    if canonical not in queue:
                        queue.append(canonical)
                else:
                    if canonical not in external_checked:
                        code = status(canonical, False)
                        external_checked[canonical] = code
                        if isinstance(code, int) and code >= 400:
                            broken.append({"url": canonical, "source": url, "status": code})
                        elif not isinstance(code, int):
                            broken.append({"url": canonical, "source": url, "status": code})
        except requests.RequestException as e:
            broken.append({"url": url, "source": "CRAWL_START", "status": f"ERROR: {e}"})


if __name__ == "__main__":
    print(f"Link audit for {BASE}\n")
    crawl(BASE)
    print(f"\n{'='*60}")
    print(f"Visited: {len(visited)} pages")
    print(f"Checked: {len(external_checked)} external links")
    print(f"Broken:  {len(broken)}")
    print(f"A11y issues: {len(a11y_issues)}")
    if broken:
        for b in broken:
            print(f"  ❌ [{b['status']}] {b['url']} (from {b['source']})")
    if a11y_issues:
        for a in a11y_issues:
            print(f"  ⚠️  [{a['page']}] {a['issue']}")
    if broken:
        sys.exit(1)
    else:
        print("  ✅ All links OK")
        if a11y_issues:
            print(f"  ⚠️  {len(a11y_issues)} accessibility warnings (see above)")
        sys.exit(0)
