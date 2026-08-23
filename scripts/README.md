# Publishing Scripts

Run `python3 scripts/build.py` from the repository root after changing `content/site.json`.

The script validates registered page paths, updates generated navigation in `index.html`, and writes `sitemap.xml`. Keep generated navigation between the `GENERATED:NAV-START` and `GENERATED:NAV-END` markers.
