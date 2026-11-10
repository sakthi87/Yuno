# Run Yuno without Docker (ODP360-style)

**No npm. No Docker. No compile.**  
Uses prebuilt Node runtime + `backend/node_modules` + built UI.

Release: https://github.com/sakthi87/Yuno/releases/tag/v1.2.0

---

## Quick start (recommended)

### Option A — Air-gapped / no internet

Copy the whole repo (must include `offline/`) via USB or internal share, **or** clone tag `v1.2.0` on a machine that already has the files, then take that folder offline.

```bash
cd Yuno
chmod +x scripts/*.sh

# 1) Install prebuilt runtime from offline/ (no network)
YUNO_OFFLINE_ONLY=1 ./scripts/download-prebuilt.sh

# 2) Start
./scripts/start-prebuilt.sh
```

Open **http://localhost:3001**  
Login: **admin** / **admin**

Stop:

```bash
./scripts/stop-prebuilt.sh
```

### Option B — Machine with internet

```bash
git clone --branch v1.2.0 --depth 1 https://github.com/sakthi87/Yuno.git
cd Yuno
chmod +x scripts/*.sh

# Uses offline/ if present; otherwise downloads from the v1.2.0 release
./scripts/download-prebuilt.sh

./scripts/start-prebuilt.sh
```

Open **http://localhost:3001** — login **admin** / **admin**

```bash
./scripts/stop-prebuilt.sh
```

---

## Step-by-step detail

### 1. Get the code

```bash
git clone --branch v1.2.0 --depth 1 https://github.com/sakthi87/Yuno.git
cd Yuno
chmod +x scripts/*.sh
```

Or download the source ZIP from GitHub and unzip.

### 2. Install the prebuilt runtime

`./scripts/download-prebuilt.sh` extracts:

| Input | Result |
|-------|--------|
| `yuno-runtime-<os-arch>.tar.gz` | `runtime/bin/node` + `backend/node_modules/` |
| `frontend-dist.zip` (if needed) | `frontend/dist/` |

**Where the packages live**

| Location | Path |
|----------|------|
| In the git tag / clone | `offline/yuno-runtime-*.tar.gz`, `offline/frontend-dist.zip` |
| GitHub Release downloads | https://github.com/sakthi87/Yuno/releases/tag/v1.2.0 |

Examples:

- macOS Apple Silicon: `yuno-runtime-darwin-arm64.tar.gz`
- Linux x86_64: `yuno-runtime-linux-x64.tar.gz`

**Air-gap (force local files only):**

```bash
YUNO_OFFLINE_ONLY=1 ./scripts/download-prebuilt.sh
```

If that fails, place the matching `.tar.gz` into `offline/` first (from the Release page or another copy of the repo).

### 3. Start

```bash
./scripts/start-prebuilt.sh
```

| What | Value |
|------|--------|
| UI + API | http://localhost:3001 |
| Login | `admin` / `admin` |
| Health | http://localhost:3001/api/v1/health |
| Logs | `logs/yuno-api.log` |

### 4. Stop

```bash
./scripts/stop-prebuilt.sh
```

---

## Optional: one USB transfer bundle

On a connected machine:

```bash
./scripts/build-offline-bundle.sh
# copy dist-offline/yuno-offline-<platform>.tar.gz to the locked host
```

On the locked host:

```bash
tar -xzf yuno-offline-<platform>.tar.gz
cd yuno-offline-<platform>
./scripts/start-prebuilt.sh
```

(Runtime is often already extracted in that bundle.)

---

## Build machine only (publish new artifacts)

Not needed at workplace:

```bash
./scripts/package-prebuilt.sh
./scripts/package-prebuilt.sh --platform=linux-x64 --docker   # optional

mkdir -p offline
cp dist-prebuilt/yuno-runtime-*.tar.gz dist-prebuilt/frontend-dist.zip offline/
gh release upload v1.2.0 dist-prebuilt/*.tar.gz dist-prebuilt/frontend-dist.zip --clobber
```
