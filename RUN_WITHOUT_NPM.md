# Run Yuno without npm (workplace)

Mirrors the ODP360 approach: **clone source (small) + pull prebuilt runtime**.

Yuno’s API is Node-based, so the prebuilt runtime is a **Docker image** (equivalent to ODP360’s JARs). You do **not** need `npm`, Maven, or a frontend build at the workplace.

## Prerequisites

- Docker Desktop / Docker Engine
- Git (or download the repo ZIP from GitHub)

## 1. Get the code

```bash
git clone --depth 1 https://github.com/sakthi87/yuno.git
cd yuno
chmod +x scripts/*.sh
```

## 2. Get the prebuilt image

```bash
export DOCKERHUB_USER=sakthipsgit
export IMAGE_TAG=1.0.0
./scripts/download-prebuilt.sh
```

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

## Notes

- Data persists in the Docker volume `yuno-data`.
- No `npm install`, no `npm start`, no Vite build on the locked-down machine.
- Building/pushing images is done once on a machine that has Node + Docker (see `DOCKER_HUB.md`).
