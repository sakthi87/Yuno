# Yugabyte Platform — Production Install Bundle

Production-grade, **offline-capable** installer for the Operations Console control plane.

## Documentation

| Document | Purpose |
|----------|---------|
| **[docs/INSTALLATION_AND_SETUP.md](docs/INSTALLATION_AND_SETUP.md)** | VM install, air-gap bundle, TLS, ops, troubleshooting |
| **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)** | Read/write REST API for UI, agents, and customers |

## Quick start (air-gapped VM)

**1. On internet-connected build machine:**

```bash
cd yuno-install/scripts
./build-offline-bundle.sh
# Copy PostgreSQL RPMs/DEBs into yuno-install/bundle/packages/
tar -czf yuno-platform-offline.tar.gz yuno-install/
```

**2. On target VM (no internet):**

```bash
tar -xzf yuno-platform-offline.tar.gz
cd yuno-install
export OFFLINE_INSTALL=true
sudo ./install.sh
```

## What is already in `yuno-install/bundle/`?

| Included (after `build-offline-bundle.sh`) | Not included — add before air-gap transfer |
|--------------------------------------------|---------------------------------------------|
| Platform API + Node `node_modules` | **PostgreSQL RPMs** (RHEL-specific) |
| Pre-built UI (`bundle/ui/dist`) | **nginx RPM** (for HTTPS) |
| SQL migrations, install scripts | Optional: portable Node tarball |
| Documentation copies | |

**To download RHEL 9 RPMs** (on a connected RHEL/Rocky machine or with Docker):

```bash
cd yuno-install/scripts
./download-rhel-packages.sh
```

Then create the transfer archive:

```bash
tar -czf yuno-platform-offline.tar.gz yuno-install/
```

## Production features

- Pre-flight CPU/RAM/disk checks
- Offline bundle (API + UI + node_modules, no npm on target)
- PostgreSQL schema, indexes, empty production defaults
- Generated **AGENT_API_TOKEN** / **ADMIN_API_TOKEN** (`/etc/yuno/secrets.env`)
- **No remote PostgreSQL access** — ingest via HTTPS API only
- TLS via nginx (self-signed or replace with corporate cert)
- Host firewall rules
- Daily backup cron + upgrade/rollback/uninstall scripts
- **Settings UI** — TLS upload + LDAP/SSO (Platform Health → Settings)
- **systemd auto-start** — `yuno-platform.target` enables API, nginx, PostgreSQL on boot

## Layout

```text
yuno-install/
├── install.sh
├── uninstall.sh
├── docs/
├── bundle/              ← generated offline artifacts
├── migrations/
├── scripts/
├── api/ · ui/ · agents/ · config/ · lib/ · postgres/
```

## Schema → API → UI

See `config/schema-manifest.json` and `docs/API_REFERENCE.md`.
