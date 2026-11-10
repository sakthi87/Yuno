# RHEL 8.10 offline RPM list

Place these in `yuno-install/bundle/packages/` before air-gap transfer.

## Auto-download (recommended)

On a Mac with Docker, or on a connected RHEL 8 machine:

```bash
export RHEL_MAJOR=8
./yuno-install/scripts/download-rhel-packages.sh
```

## Manual download (on connected RHEL 8.10)

```bash
sudo dnf install -y dnf-plugins-core
sudo dnf module enable -y postgresql:15
mkdir -p /tmp/yuno-rpms && cd /tmp/yuno-rpms
dnf download --resolve postgresql-server postgresql nginx openssl
# copy *.rpm to yuno-install/bundle/packages/
```

## Minimum packages

| Package | Purpose |
|---------|---------|
| `postgresql-server` | Metadata database |
| `postgresql` | Client libraries |
| `nginx` | HTTPS termination |
| `openssl` | TLS tools |

## Notes for RHEL 8.10

- PostgreSQL 15 via AppStream module: `postgresql:15`
- Service name is usually `postgresql` (not `postgresql-15`)
- Node.js is **not** required on the VM — bundled in `bundle/backend/node_modules`
