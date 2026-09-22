# cupnet Mind Map — Done vs. Future

> Source: `project-status-summary.md` + `trisektor-self-hosted-stack-deployment-status.md` (2026-09-05)
> Server: `v2202609410969512760` (89.58.63.213) | User: `leo`

## ✅ DONE

### Server baseline (phases 0–12)

- Debian 13.6 (Trixie) updated, unattended upgrades configured
- `leo` sudo admin (UID 1000), Ed25519 key, SSH alias `leo-one`
- SSH hardening: PermitRootLogin no, key-only, AllowUsers leo
- UFW: deny inbound, allow TCP 22 (SSH), TCP 80/443 (Caddy)
- Fail2ban: maxretry=4, findtime=10m, bantime=1h
- 4 GiB persistent swap (`/swapfile`, swappiness=10)
- Snapshot: `2026-09-04-debian-secure-baseline` (offline, available)

### Backups — local only

- Restic repo at `/srv/stack/backups/restic` (mode 700)
- Password file at `/etc/stack-secrets/restic-password.txt` (mode 600)
- Scripts: `/usr/local/bin/stack-backup` + `/usr/local/bin/stack-backup-prune`
- Cron: daily backup 02:00, weekly prune Sundays 03:00
- First snapshot `e0fa9fc8` — restore test passed (6 files → `/tmp/restic-restore-test`)
- Prune policy: 2 daily, 4 weekly, 2 monthly

### Docker

- Engine 29.8.0 + Compose v5.5.1
- Log rotation: `/etc/docker/daemon.json` (10m, 3 files)
- `leo` in docker group (root-equivalent — do not add agents)
- Shared network `proxy` (172.18.0.0/16)
- `/srv/stack` layout: backups, caddy, n8n, nextcloud, omniroute, postgres
- `/etc/stack-secrets`: root:stack-secrets 0750, `leo` in stack-secrets group

### Caddy — deployed & verified

- Container: `caddy` (caddy:2.10.2-alpine) on `/srv/stack/caddy/compose.yml`
- Ports: 0.0.0.0:80, 0.0.0.0:443 (IPv4 + IPv6)
- Volumes: `caddy_caddy_data`, `caddy_caddy_config`
- `auto_https off` — uses Cloudflare Origin CA cert explicitly
- Certs mounted read-only: `/etc/stack-secrets/caddy/cloudflare-origin.{crt,key}`
- HSTS: `max-age=15552000` (no includeSubDomains, no preload)
- CalDAV/CardDAV redirects verified
- `caddy validate` passes; OCSP warning expected/non-blocking

### Nextcloud — deployed & login verified

- Containers: `nextcloud` (nextcloud:apache), `nextcloud-cron`, `nextcloud-db` (mariadb:11.8.9), `redis-nextcloud` (redis:7-alpine)
- Networks: `proxy` (Caddy↔Nextcloud) + internal-only (Nextcloud↔MariaDB↔Redis)
- Volumes: `nextcloud_nextcloud_db`, `nextcloud_nextcloud_html`
- Config: trusted_proxies=172.18.0.0/16, overwritehost=cloud.trisektor.org, overwriteprotocol=https, Redis locking/cache, mysql.utf8mb4=true, cron mode
- Status: installed=true, maintenance=false, needsDbUpgrade=false, version 34.0.3.2
- MariaDB version corrected from 12.3.3 → 11.8.9 (rebuilt cleanly)
- Browser login verified; CalDAV/CardDAV discovery verified

### Cloudflare

- DNS: A records for `cloud.trisektor.org` + `n8n.trisektor.org` → `89.58.63.213`, both proxied (orange cloud)
- SSL/TLS: Full (strict) ✅ | Always Use HTTPS: enabled ✅
- Origin CA cert: valid 2026-09-05 → 2041-09-01, coverage `trisektor.org` + `*.trisektor.org`
- Verified with OpenSSL; public HSTS confirmed

---

## ⏳ FUTURE / PENDING

### VPN — AmneziaWG (NOT STARTED)

- Chosen over WireGuard for Oman DPI/censorship; full-tunnel mode
- Planned subnet: `10.66.66.0/24` | Server: `10.66.66.1/24` | Clients: `10.66.66.11`–`10.66.66.14`
- Requires: preflight checks, snapshot, official Amnezia desktop app
- UFW rule for UDP port: pending (port TBD by installer)
- Clients: Mac, Windows, iPhone, Android (4 devices, full-tunnel)

### Nextcloud finalization

- [ ] Cron first-run warning — verify after sidecar cycle; manually run `cron.php` only if needed
- [ ] Set `maintenance_window_start` (e.g. `2` = 02:00 UTC)
- [ ] Run `occ maintenance:repair --include-expensive` (mimetype migrations, while instance empty)
- [ ] Configure outbound SMTP and test (required for password reset, notifications, sharing)
- [ ] Enable + test TOTP for `leo`; securely store recovery codes
- [ ] Set `leo` quota to 180 GB (`occ user:setting leo files quota '180 GB'`)
- [ ] Upload/download/delete non-sensitive test file
- [ ] Test desktop/mobile/WebDAV/CalDAV/CardDAV clients

### n8n — NOT DEPLOYED

- `n8n.trisektor.org` currently returns Caddy temporary text response
- Plan: PostgreSQL (not SQLite), generated `N8N_ENCRYPTION_KEY`, separate Compose project + internal network
- Env: N8N_HOST, N8N_PROTOCOL, N8N_EDITOR_BASE_URL, WEBHOOK_URL, N8N_PROXY_HOPS=1
- Begin regular mode, low concurrency; enable execution-data pruning from start
- Create database backup procedures before storing meaningful workflows/credentials
- Cloudflare Access planned AFTER n8n deployed + webhook requirements known

### Cloudflare Access — NOT CONFIGURED

- No Zero Trust Access applications/policies created yet
- Recommended order: deploy n8n → identify webhook endpoints → configure Access for editor surface → test incognito → decide Nextcloud separately
- Do NOT put browser-based Access login in front of `cloud.trisektor.org` until desktop/mobile/WebDAV/CalDAV/CardDAV requirements are understood

### Off-site backups (R2) — NOT IMPLEMENTED

- Create R2 bucket + API credentials
- Configure Restic S3 backend or rclone remote for R2
- Implement 2 weekly backup jobs, retain 1 latest copy, verify ≤10 GB
- Required before meaningful data: backup Nextcloud volume, MariaDB dump, future n8n PostgreSQL dump, `/srv/stack/caddy` config, Caddy named volumes, `/etc/stack-secrets` encrypted backup

### Hardening & monitoring — PENDING

- SSH keys-only + root disable: deferred until VPN + recovery path confirmed
- Origin protection: TCP 80/443 currently open to Internet (needed for Cloudflare-to-origin)
  - Option A: restrict to Cloudflare IP ranges + AOP
  - Option B: move to Cloudflare Tunnel (hides origin IP, removes public inbound web ports)
  - Do NOT apply until recovery path verified
- Monitoring: backup success, disk, CPU/RAM, service health — not started

### Deferred / future

- Hermes Agent (dedicated user + workspace, Docker sandbox)
- OmniRoute (internal API gateway, bind to localhost)
- Claude CLI setup via OmniRoute as Anthropic-compatible endpoint

---

## ⚠️ CRITICAL CONSTRAINTS

- `leo` in `docker` group = root-equivalent; do NOT add Hermes/agents to docker or stack-secrets
- Never commit `/etc/stack-secrets` to Git; never paste secrets in chat/screenshots
- Never gray-cloud `cloud.trisektor.org` / `n8n.trisektor.org` while Origin CA cert is in use
- Never expose MariaDB/Redis/n8n/PostgreSQL/OmniRoute/Docker API ports publicly
- Maintain 80–100 GB free disk as operational margin
- Do not run blind `docker compose pull && up -d` upgrades; snapshot + backup first
- Do not change Cloudflare from Full (strict) to Flexible
- Do not use mutable `mariadb:lts` tag for Nextcloud again
- Do not attempt in-place MariaDB downgrade
- Do not delete Docker volumes during maintenance/upgrades
- Do not enforce Nextcloud 2FA before verifying factor + saved recovery codes
- Do not apply blanket Cloudflare Access to n8n before testing webhook behavior
- Do not treat VPS snapshot as the only backup
