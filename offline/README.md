# Offline prebuilt assets (air-gapped)

These files are the **compiled/prebuilt runtime** Yuno needs when the workplace has **no internet** (and no npm).

| File | Purpose |
|------|---------|
| `yuno-runtime-darwin-arm64.tar.gz` | macOS Apple Silicon: portable Node 20 + `backend/node_modules` |
| `yuno-runtime-linux-x64.tar.gz` | Linux x86_64: portable Node 20 + `backend/node_modules` |
| `frontend-dist.zip` | Built UI (`frontend/dist`) |

## Also on GitHub Release

Same files are uploaded to:  
https://github.com/sakthi87/Yuno/releases/tag/v1.2.0

| Asset URL pattern |
|-------------------|
| `https://github.com/sakthi87/Yuno/releases/download/v1.2.0/yuno-runtime-<os>-<arch>.tar.gz` |

**Air-gapped hosts cannot use that URL.** Copy this `offline/` folder (or the whole repo / `dist-offline` bundle) via USB before you go offline.

## On the locked machine

```bash
# If offline/ already contains the matching tar.gz:
./scripts/download-prebuilt.sh    # extracts locally — no network
./scripts/start-prebuilt.sh
```

Force offline-only (fail if file missing, never curl):

```bash
YUNO_OFFLINE_ONLY=1 ./scripts/download-prebuilt.sh
```
