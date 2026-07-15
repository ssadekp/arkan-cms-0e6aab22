# Self-hosted white-label CMS — Node build target.
#
# Build:
#   docker build -t whitelabel-cms .
# Run:
#   docker run --env-file .env -p 3000:3000 whitelabel-cms
#
# The production image runs the TanStack Start Nitro output built for the
# Node preset. Configure `nitro.preset = "node-server"` when producing this
# image (default vite build targets Cloudflare Workers).

# ---------- builder ----------
FROM oven/bun:1.1 AS builder
WORKDIR /app

COPY package.json bun.lockb* bunfig.toml* ./
RUN bun install --frozen-lockfile || bun install

COPY . .

# Emit Node server output. NITRO_PRESET overrides the default preset from
# @lovable.dev/vite-tanstack-config.
ENV NITRO_PRESET=node-server
RUN bun run build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# TanStack Start / Nitro node-server output lands in .output/
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1

CMD ["node", ".output/server/index.mjs"]
