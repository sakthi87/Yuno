# Yuno all-in-one image: API + prebuilt UI (no npm/compile at workplace).
# Build from repo root:
#   docker build -t yuno-platform:1.0.0 .

FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json ./
COPY backend/src ./src
# Seed imports demo estate data from this path inside the image
COPY frontend/src/services ./frontend/src/services
COPY frontend/dist ./ui

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
ENV DB_DRIVER=sqlite
ENV DB_PATH=/data/platform.db
ENV AUTO_SEED=true
ENV DEMO_MODE=true
ENV STATIC_DIR=/app/ui
ENV YUNO_COMPANY_NAME="Yuno Platform"

VOLUME ["/data"]
EXPOSE 3001
CMD ["node", "src/index.js"]
