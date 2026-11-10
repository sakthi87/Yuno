# Yugabyte Platform — Installation and Setup Guide

**Version:** 1.0.0  
**Audience:** Platform administrators installing on an air-gapped or internet-connected Linux VM

---

## 1. Overview

Yugabyte Platform is installed as a **control plane** on a single VM:

1. **PostgreSQL** — metadata store (local only)
2. **Platform API** — read/write REST endpoints
3. **Web UI** — Operations Console (served by API or nginx)
4. **Agents / integrations** — push data via **HTTPS ingest API** (not direct DB access)

Production installs start with an **empty database**. Data appears in the UI after agents or manual API writes populate PostgreSQL.

---

## 2. Architecture

```text
Agents / Customers                VM (Yuno Platform)
─────────────────                ──────────────────
HTTPS + AGENT_API_TOKEN  ──────►  nginx (TLS) :443
                                        │
                                        ▼
                                   API :8080 (localhost)
                                        │
                                        ▼
                                   PostgreSQL :5432 (localhost only)
                                        ▲
                                   UI static files
```

**Security defaults:**
- PostgreSQL listens on **localhost only**
- API binds to **127.0.0.1** when behind nginx TLS
- **AGENT_API_TOKEN** required for all `/api/v1/ingest/*` writes
- **ADMIN_API_TOKEN** required for settings and admin operations
- Secrets in `/etc/yuno/secrets.env` (chmod **600**)

---

## 3. Requirements

### 3.1 VM sizing (minimum)

| Resource | Minimum |
|----------|---------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Disk | 20 GB free (`/opt/yuno`) |
| OS | RHEL 8+, Rocky 9, Ubuntu 22.04+ |

### 3.2 Air-gapped (offline) install

The target VM has **no internet**. You must build an offline bundle on a connected machine first.

**On build machine (with internet):**

```bash
cd yuno-install/scripts
chmod +x build-offline-bundle.sh
./build-offline-bundle.sh
```

Copy OS packages into the bundle before transfer:

```bash
# Example: RHEL — download postgresql15 RPMs on connected host
cp postgresql15*.rpm yuno-install/bundle/packages/

# Optional: portable Node.js
cp node-v20.18.0-linux-x64.tar.xz yuno-install/bundle/node/

# Create transfer archive
tar -czf yuno-platform-offline.tar.gz yuno-install/
```

Transfer `yuno-platform-offline.tar.gz` to the air-gapped VM via approved media.

**Verify bundle on target VM:**

```bash
cd yuno-install/bundle
shasum -a 256 -c CHECKSUMS.sha256
```

---

## 4. Installation steps

### 4.1 Extract and run

```bash
tar -xzf yuno-platform-offline.tar.gz
cd yuno-install
chmod +x install.sh scripts/*.sh api/*.sh ui/*.sh postgres/*.sh uninstall.sh
export OFFLINE_INSTALL=true
sudo ./install.sh
```

### 4.2 Interactive prompts

| Prompt | Production recommendation |
|--------|---------------------------|
| Company name | Customer legal/display name |
| Install root | `/opt/yuno` (default) |
| API port | `8080` (internal, behind nginx) |
| Public hostname | DNS name users/agents will use |
| Enable TLS | **Yes** — nginx terminates HTTPS |
| PostgreSQL | Local on same VM |
| Demo seed | **No** — production uses real agent data |

### 4.3 What the installer does

| Step | Action |
|------|--------|
| 0 | Pre-flight (CPU/RAM/disk), prerequisites, customer inputs |
| 1 | PostgreSQL + migrations + indexes + empty defaults |
| 2 | Write `/etc/yuno/yuno.env` + `/etc/yuno/secrets.env` + API tokens |
| 3 | Test DB connectivity |
| 4 | Deploy API (offline bundle or npm) |
| 5 | Health check `/api/v1/health` |
| 6 | Validate empty read APIs |
| 7 | Deploy UI |
| 8 | TLS (nginx) + firewall |
| 9 | Daily backup cron (02:00) |

**Install log:** `/opt/yuno/logs/install-YYYYMMDD-HHMMSS.log`  
Each line is tagged `SUCCESS`, `RETRY`, or `FAILURE`.

---

## 5. Post-install configuration

### 5.1 Retrieve API tokens

```bash
sudo cat /etc/yuno/secrets.env
```

| Token | Purpose |
|-------|---------|
| `AGENT_API_TOKEN` | Agents and automated ingest |
| `ADMIN_API_TOKEN` | Settings, LDAP/SSO, admin reseed |

Distribute **AGENT_API_TOKEN** only to trusted agents. Never embed in UI or public repos.

### 5.2 TLS certificate (Settings UI)

1. Open **Platform Health → Settings**
2. Enter `ADMIN_API_TOKEN` from `/etc/yuno/secrets.env`
3. Upload corporate `.crt` and `.key` files
4. Click **Upload certificate & restart nginx** — nginx restarts automatically

### 5.3 LDAP / SSO (Settings UI)

1. **Platform Health → Settings → LDAP / SSO**
2. Enable LDAP and/or SSO, fill IdP URL, Bind DN, Base DN
3. Click **Save LDAP / SSO settings**

(API equivalent: `PUT /api/v1/admin/settings/auth` — see API_REFERENCE.md)

### 5.4 Register agents

Provide agents with:

- **Collector base URL:** `https://YOUR_HOST/api/v1/ingest`
- **Token header:** `Authorization: Bearer <AGENT_API_TOKEN>`

See **API_REFERENCE.md** for write endpoints.

---

## 6. Operations

### 6.1 Service management

```bash
sudo systemctl status yuno-api
sudo systemctl restart yuno-api
sudo systemctl status nginx
```

### 6.2 Manual backup

```bash
source /etc/yuno/yuno.env
source /etc/yuno/secrets.env
sudo -E /opt/yuno/scripts/backup-database.sh
```

Backups: `/opt/yuno/backups/yuno_platform-*.sql.gz`

### 6.3 Restore

```bash
sudo -E /opt/yuno/scripts/restore-database.sh /opt/yuno/backups/yuno_platform-YYYYMMDD-HHMMSS.sql.gz
sudo systemctl restart yuno-api
```

### 6.4 Upgrade

```bash
# Pre-upgrade backup is automatic
sudo ./scripts/upgrade.sh
```

### 6.5 Rollback

```bash
sudo ./scripts/rollback.sh /opt/yuno/backups/yuno_platform-YYYYMMDD-HHMMSS.sql.gz
```

### 6.6 Uninstall

```bash
sudo ./uninstall.sh
```

---

## 7. Troubleshooting

| Symptom | Check |
|---------|-------|
| UI empty | Expected until ingest — verify agents calling `/api/v1/ingest/*` |
| 401 on ingest | Wrong or missing `AGENT_API_TOKEN` |
| API won't start | `journalctl -u yuno-api`, `/opt/yuno/logs/yuno-api.log` |
| DB connection failed | `psql` with credentials from secrets.env |
| TLS errors | `nginx -t`, cert paths in `/opt/yuno/tls/` |

---

## 8. File locations

| Path | Purpose |
|------|---------|
| `/etc/yuno/yuno.env` | Non-secret configuration |
| `/etc/yuno/secrets.env` | Tokens and DB password |
| `/opt/yuno/api/` | Node.js API runtime |
| `/opt/yuno/ui/` | Built React UI |
| `/opt/yuno/logs/` | Install and runtime logs |
| `/opt/yuno/backups/` | PostgreSQL dumps |
| `/opt/yuno/tls/` | TLS certificates |
| `yuno-install/migrations/` | Versioned schema |
| `yuno-install/config/schema-manifest.json` | Table → API → UI map |

---

## 9. Ready checklist

- [ ] Offline bundle built and checksum verified
- [ ] `install.sh` completed with SUCCESS log
- [ ] `GET /api/v1/health` returns `status: ok`
- [ ] UI loads with zero KPIs (empty production state)
- [ ] `AGENT_API_TOKEN` distributed to agents
- [ ] LDAP/SSO configured (if required)
- [ ] TLS certificate trusted by users/agents
- [ ] Backup cron present in `/etc/cron.d/yuno-platform-backup`
- [ ] Firewall allows 443 (and blocks external 5432)

**You are production-ready when all items above are complete.**
