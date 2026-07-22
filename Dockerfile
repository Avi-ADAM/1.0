# syntax=docker/dockerfile:1
# SvelteKit API instance (adapter-node) — runs on the Linux VPS alongside Strapi.
# See docs/DEPLOY_API_DOCKER.md and docs/PLAN_PROXY_SECURITY.md (stage 3).
#
# Build (from repo root, BuildKit required):
#   docker build --secret id=envfile,src=.env -t 1lev1/sveltekit-api:latest .
#
# The .env is mounted as a BuildKit secret so VITE_*/$env/static values are
# available to `vite build` WITHOUT being baked into any image layer.

# ---- Stage 1a: production node_modules ----
# Kept in its OWN stage so the runtime image's biggest layer (~240MB) is keyed
# on package*.json / .npmrc alone. Deriving it in the build stage (npm ci +
# `npm prune --omit=dev` after `COPY . .`) made it a fresh layer on EVERY code
# change — i.e. a full 240MB re-upload on each `docker push`. Now it is
# "Layer already exists" unless the lockfile actually moved.
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --omit=dev

# ---- Stage 1b: build ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci

COPY . .

# ADAPTER is unset -> svelte.config.js falls back to adapter-node (out: build)
# Bump V8 heap: the vite build peaks past the default ~2GB old-space cap and OOMs.
RUN --mount=type=secret,id=envfile,target=/app/.env \
    NODE_OPTIONS=--max-old-space-size=4096 npm run build

# ---- Stage 2: runtime ----
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    # adapter-node defaults to 512kb; /api/upload proxies files to Strapi/Cloudinary
    BODY_SIZE_LIMIT=50M

# node_modules FIRST and from prod-deps: big + rarely changing, so it stays a
# cached/already-pushed layer while the small ./build layer churns above it.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

USER node

CMD ["node", "build"]
