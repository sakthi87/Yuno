# Run Yuno without Docker (ODP360-style)

**No npm. No Docker. No compile. No GitHub download at runtime.**  
Uses packages already in `offline/` → extracts into `runtime/`, `backend/node_modules/`, `frontend/dist/`.

Release / tag: https://github.com/sakthi87/Yuno/releases/tag/v1.3.0

---

## Quick start

```bash
git clone --branch v1.3.0 --depth 1 https://github.com/sakthi87/Yuno.git
cd Yuno
chmod +x scripts/*.sh

# Extract from offline/ (local only — never hits the network)
./scripts/download-prebuilt.sh

# Start
./scripts/start-prebuilt.sh
```

Open **http://localhost:3001**  
Login: **admin** / **admin**

Stop:

```bash
./scripts/stop-prebuilt.sh
```

Air-gap: copy the whole repo folder (must include `offline/`) via USB or share, then run the same two scripts.

---

## What `download-prebuilt.sh` does

| File in `offline/` | Extracted to |
|--------------------|--------------|
| `yuno-runtime-darwin-arm64.tar.gz` or `yuno-runtime-linux-x64.tar.gz` | `runtime/bin/node` + `backend/node_modules/` |
| `frontend-dist.zip` | `frontend/dist/` |

Your machine picks the matching runtime by OS/arch. No curl, no Release download.

If a file is missing under `offline/`, the script exits with an error — fix the clone/copy, don’t expect a network fallback.

---

## Ports & logs

| What | Value |
|------|--------|
| UI + API | http://localhost:3001 |
| Login | `admin` / `admin` |
| Health | http://localhost:3001/api/v1/health |
| Logs | `logs/yuno-api.log` |

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

## Build machine only (refresh `offline/` artifacts)

Not needed at workplace:

```bash
./scripts/package-prebuilt.sh
./scripts/package-prebuilt.sh --platform=linux-x64 --docker   # optional cross-pack

mkdir -p offline
cp dist-prebuilt/yuno-runtime-*.tar.gz dist-prebuilt/frontend-dist.zip offline/
```
