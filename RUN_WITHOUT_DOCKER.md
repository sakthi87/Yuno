# Run Yuno without Docker (code + prebuilt runtime separately)

Same pattern as ODP360 `RUN_WITHOUT_DOCKER.md`.

## Overview

1. **Download source code** from GitHub (small).
2. **Download prebuilt runtime** from the GitHub **Release** (portable Node + `backend/node_modules`).
3. Start with `./scripts/start-prebuilt.sh` — **no npm, no Docker, no compile**.

Release: https://github.com/sakthi87/Yuno/releases/tag/v1.2.0

## 1. Get the code

```bash
git clone --depth 1 https://github.com/sakthi87/Yuno.git
cd Yuno
chmod +x scripts/*.sh
```

Or: GitHub → Code → Download ZIP.

## 2. Get the prebuilt runtime

### Where is `yuno-runtime-<os-arch>.tar.gz`?

| Location | URL / path |
|----------|------------|
| **GitHub Release (online)** | https://github.com/sakthi87/Yuno/releases/tag/v1.2.0 |
| Direct download example | `https://github.com/sakthi87/Yuno/releases/download/v1.2.0/yuno-runtime-linux-x64.tar.gz` |
| **In this repo (air-gap)** | `offline/yuno-runtime-*.tar.gz` (committed / copied with the project) |

### Air-gapped / no internet (recommended for locked environments)

Copy the whole project **including** `offline/` (USB, shared drive, internal mirror). Then:

```bash
YUNO_OFFLINE_ONLY=1 ./scripts/download-prebuilt.sh   # uses offline/ only — no curl
```

Or build a single transfer archive on a connected machine:

```bash
./scripts/build-offline-bundle.sh
# copy dist-offline/yuno-offline-<platform>.tar.gz to the locked host
```

### Online machine (optional)

```bash
./scripts/download-prebuilt.sh
```

This uses `offline/` first; only if missing, it downloads from the GitHub Release.

| Asset | Extracted as |
|-------|--------------|
| `yuno-runtime-<platform>.tar.gz` | `runtime/bin/node` + `backend/node_modules/` |
| `frontend-dist.zip` | `frontend/dist/` (if not already present) |

## 3. Start

```bash
./scripts/start-prebuilt.sh
```

- UI + API: **http://localhost:3001**
- Login: `admin` / `admin`

## 4. Stop

```bash
./scripts/stop-prebuilt.sh
```

## Ports

| Service | Port |
|---------|------|
| UI + API (Express serves both) | 3001 |

## Build machine only (publish artifacts)

```bash
./scripts/package-prebuilt.sh
# optional Linux artifact from Mac:
./scripts/package-prebuilt.sh --platform=linux-x64 --docker

gh release upload v1.2.0 dist-prebuilt/*.tar.gz dist-prebuilt/frontend-dist.zip --clobber
```
