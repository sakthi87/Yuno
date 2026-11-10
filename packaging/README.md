# Yugabyte Platform — Packaging

Two targets, one codebase:

| Target | Use case | How to run |
|--------|----------|------------|
| **Mac** | Local development & UI testing | `./packaging/mac/start.sh` |
| **RHEL 8.10** | Production VM (restricted / air-gapped) | Build tarball → `install.sh` on VM |

---

## Mac — local testing

**Requirements:** Node.js 20+, npm

```bash
# First time
chmod +x packaging/mac/*.sh
./packaging/mac/setup.sh

# Every dev session
./packaging/mac/start.sh
# or: npm run dev:mac
```

| Setting | Value |
|---------|-------|
| Database | SQLite (`backend/data/platform.db`) |
| Demo data | Yes (`AUTO_SEED=true`) |
| UI | http://localhost:5173 |
| API | http://localhost:3001 |

Config file: `packaging/mac/config/yuno.env`

---

## RHEL 8.10 — restricted environment

### Step 1: Build package (connected machine)

Mac (with Docker for RPM download) or RHEL 8 build host:

```bash
chmod +x packaging/rhel/build-package.sh
chmod +x yuno-install/scripts/*.sh yuno-install/install.sh

./packaging/rhel/build-package.sh
```

Output:

```text
packaging/dist/yuno-platform-rhel810-YYYYMMDD.tar.gz
packaging/dist/yuno-platform-rhel810-YYYYMMDD.tar.gz.sha256
```

**What's inside the tarball:**

| Component | Included |
|-----------|----------|
| Platform API + Node deps | ✅ `bundle/backend/` |
| Built UI | ✅ `bundle/ui/dist/` |
| Install scripts + SQL migrations | ✅ `yuno-install/` |
| PostgreSQL + nginx RPMs | ✅ if Docker/RHEL download succeeded |

If RPM download fails on Mac without Docker, copy RPMs manually — see `packaging/rhel/RPM-LIST.md`.

### Step 2: Install on air-gapped RHEL 8.10 VM

```bash
tar -xzf yuno-platform-rhel810-*.tar.gz
cd yuno-install
sudo OFFLINE_INSTALL=true ./install.sh
```

| Setting | Value |
|---------|-------|
| Database | PostgreSQL (local) |
| Demo data | No (`AUTO_SEED=false`) |
| UI | https://\<hostname\>/ |
| Boot persistence | systemd (`yuno-platform.target`) |

---

## Directory layout

```text
packaging/
├── README.md           ← this file
├── dist/               ← generated RHEL tarballs (gitignored)
├── mac/
│   ├── setup.sh
│   ├── start.sh
│   └── config/yuno.env
└── rhel/
    ├── build-package.sh
    └── RPM-LIST.md

yuno-install/           ← RHEL installer (used by build-package.sh)
├── install.sh
├── bundle/             ← generated offline artifacts
└── ...
```

---

## Quick commands (repo root)

```bash
npm run dev:mac          # Mac local dev
npm run package:rhel     # Build RHEL 8.10 offline tarball
```
