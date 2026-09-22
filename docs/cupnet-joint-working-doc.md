# cupnet Joint Working Document

> **Purpose:** Single source of truth for the Netcup RS 2000 G12 (`leo-one`) deployment, shared between the cupnet profile (this session) and the VPN planning session (`@session:default/20260903_194446_6184c7`).
> **Last updated:** 2026-09-05
> **Superseded by:** `cupnet-mind-map.md` (compact done-vs-future view) + `cupnet/memories/MEMORY.md` (operational reference)

---

## 1. Server identity

| Field          | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| Hostname       | `v2202609410969512760` → SSH alias `leo-one`                |
| Public IPv4    | `89.58.63.213`                                              |
| Public IPv6    | `2a0a:4cc0:1:8ea:e863:75ff:fedf:c790/64`                    |
| Gateway        | `89.58.60.1`                                                |
| Interface      | `eth0`                                                      |
| OS             | Debian GNU/Linux 13.6 (Trixie), kernel 6.12.107+deb13-amd64 |
| Disk           | `/dev/vda4` — 510.8 GiB ext4, ~477 GB free                  |
| RAM            | 15 GiB                                                      |
| Swap           | 4 GiB (`/swapfile`, swappiness=10)                          |
| Account        | `leo` (UID 1000, sudo, docker group, stack-secrets group)   |
| Docker         | Engine 29.8.0, Compose v5.5.1                               |
| Shared network | `proxy` (172.18.0.0/16)                                     |

---

## 2. Phases — status

| Phase | Activity                                                              | Status                                                        |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| 0     | Root login, live inspection                                           | ✅ Complete                                                   |
| 1     | Debian update, baseline packages                                      | ✅ Complete                                                   |
| 2     | Unattended upgrades                                                   | ✅ Complete                                                   |
| 3     | Create `leo` sudo admin (UID 1000)                                    | ✅ Complete                                                   |
| 4     | Mac shell cleanup, credential removal                                 | ✅ Complete                                                   |
| 5     | Ed25519 key (`id_ed25519_netcup_leo_one`), `leo-one` alias            | ✅ Complete                                                   |
| 6     | SSH hardening (PermitRootLogin no, key-only, AllowUsers leo)          | ✅ Complete                                                   |
| 7     | UFW firewall (deny inbound, allow SSH 22, Caddy 80/443)               | ✅ Complete                                                   |
| 8     | Fail2ban (maxretry=4, findtime=10m, bantime=1h)                       | ✅ Complete                                                   |
| 9     | Swap pre-check                                                        | ✅ Complete                                                   |
| 10    | 4 GiB persistent swap (`/swapfile`, swappiness=10)                    | ✅ Complete                                                   |
| 11    | Secure baseline validation                                            | ✅ Complete                                                   |
| 12    | Netcup offline snapshot `2026-09-04-debian-secure-baseline`           | ✅ Complete                                                   |
| 13    | Docker Engine + Compose install, log rotation, `proxy` network        | ✅ Complete                                                   |
| 14    | Restic local backups (daily cron + weekly prune, restore test passed) | ✅ Complete                                                   |
| 15    | Caddy deployed + Cloudflare Origin CA cert + HSTS                     | ✅ Complete                                                   |
| 16    | Nextcloud 34.0.3.2 deployed (MariaDB 11.8.9, Redis, login verified)   | ✅ Complete                                                   |
| 17    | AmneziaWG VPN                                                         | ⏳ **NOT STARTED** (last step, after all services)            |
| 18    | n8n + PostgreSQL                                                      | 🔄 **IN PROGRESS**                                            |
| 19    | Off-site R2 backups                                                   | ⏳ **NOT STARTED** (Restic installed, R2 integration pending) |
| 20    | SSH final hardening + origin protection                               | ⏳ **PENDING**                                                |
| 21    | Monitoring (backup/disk/CPU/service health)                           | ⏳ **NOT STARTED**                                            |
| 22    | Hermes Agent + OmniRoute                                              | ⏳ **DEFERRED**                                               |

---

## 3. VPN — AmneziaWG (P1 pending)

- **Decision:** AmneziaWG over WireGuard (Oman DPI/censorship scenario); full-tunnel mode
- **Planned subnet:** `10.66.66.0/24` | Server: `10.66.66.1/24` | Clients: `10.66.66.11`–`10.66.66.14`
- **Method A:** Official Amnezia desktop app (not ppa CLI — Ubuntu-only)
- **Preflight:** `ip_forward=1` applied ✅
- **Still needed:** Amnezia app download → "Configure your server" → SSH `leo@89.58.63.213:22` → record UDP port → UFW rule → 4 client profiles (Mac, Windows, iPhone, Android)
- **Cross-session:** VPN session `@session:default/20260903_194446_6184c7` owns this workstream

---

## 4. Nextcloud — deployed, finalization pending

- **Version:** 34.0.3.2 | **MariaDB:** 11.8.9 | **Redis:** 7-alpine
- **Login verified** via browser; CalDAV/CardDAV discovery verified
- **Quota 180 GB:** planned, not applied (`occ user:setting leo files quota '180 GB'`)
- **Pending checklist:** cron first-run warning, `maintenance_window_start`, mimetype migrations, TOTP/2FA, SMTP, test upload, client tests

---

## 5. n8n — IN PROGRESS (next to install)

- `n8n.trisektor.org` currently returns Caddy temporary text response
- Plan: PostgreSQL (not SQLite), generated `N8N_ENCRYPTION_KEY`, separate Compose project + internal network
- Env vars: N8N_HOST, N8N_PROTOCOL, N8N_EDITOR_BASE_URL, WEBHOOK_URL, N8N_PROXY_HOPS=1
- Begin regular mode, low concurrency; enable execution-data pruning from start
- Cloudflare Access planned AFTER n8n deployed + webhook requirements known
- Caddy vhost to add: reverse_proxy `n8n:5678` on `n8n.trisektor.org`
- Snapshot before: `2026-09-04-debian-secure-baseline` (still available)

---

## 6. Backups — local only (R2 pending)

- Restic repo: `/srv/stack/backups/restic` (mode 700)
- Password: `/etc/stack-secrets/restic-password.txt` (mode 600)
- Scripts: `/usr/local/bin/stack-backup` + `/usr/local/bin/stack-backup-prune`
- Cron: daily backup 02:00, weekly prune Sundays 03:00
- First snapshot `e0fa9fc8` — restore test passed
- **R2 off-site:** bucket creation + credentials + Restic S3 backend pending (2 weekly, retain 1 latest, ≤10 GB)

---

## 7. Cloudflare

- Zone: `trisektor.org` | DNS: A records for `cloud.trisektor.org` + `n8n.trisektor.org` → `89.58.63.213`, both proxied (orange cloud)
- SSL/TLS: Full (strict) ✅ | Always Use HTTPS: enabled ✅
- Origin CA cert: valid 2026-09-05 → 2041-09-01
- **Do NOT gray-cloud these records while Origin CA cert is in use**

---

## 8. Critical constraints

- `leo` in `docker` group = root-equivalent; do NOT add Hermes/agents to docker or stack-secrets
- Never commit `/etc/stack-secrets` to Git; never paste secrets in chat/screenshots
- Never gray-cloud `cloud.trisektor.org` / `n8n.trisektor.org` while Origin CA cert is in use
- Never expose MariaDB/Redis/n8n/PostgreSQL/OmniRoute/Docker API ports publicly
- Maintain 80–100 GB free disk as operational margin
- Do not run blind `docker compose pull && up -d` upgrades; snapshot + backup first
- Do not change Cloudflare from Full (strict) to Flexible
- Do not use mutable `mariadb:lts` tag for Nextcloud again
- Do not treat VPS snapshot as the only backup

---

## 9. Cross-session handoff

- **VPN session:** `@session:default/20260903_194446_6184c7` — owns AmneziaWG install + client profiles
- **This session (cupnet):** owns Docker services, Caddy, Nextcloud, backups, hardening
- **Future:** Hermes Agent + OmniRoute deployment (deferred)
