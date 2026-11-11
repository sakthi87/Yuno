# Offline prebuilt assets (air-gapped)

These files ship in the repo. `./scripts/download-prebuilt.sh` extracts them locally — **no network, no GitHub, no npm**.

| File | Purpose |
|------|---------|
| `yuno-runtime-darwin-arm64.tar.gz` | macOS Apple Silicon: portable Node 20 + `backend/node_modules` |
| `yuno-runtime-linux-x64.tar.gz` | Linux x86_64: portable Node 20 + `backend/node_modules` |
| `frontend-dist.zip` | Built UI (`frontend/dist`) |

## On any machine (including locked / no internet)

```bash
./scripts/download-prebuilt.sh    # unpacks offline/ → runtime/, backend/node_modules/, frontend/dist/
./scripts/start-prebuilt.sh
```

Keep this `offline/` folder when you copy or clone the repo. Without these three files, start will fail.
