FROM node:20-slim AS base

WORKDIR /app


# 1) Install workspace dependencies and build socket artifacts
FROM base AS builder

COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --prefer-offline --no-audit --progress=false

RUN npm run build --workspace @chat/types -- --types node \
    && npm run build --workspace @chat/socket

RUN npm prune --omit=dev --legacy-peer-deps


# 2) Production runtime image
FROM node:20-slim AS socket

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/socket/package.json ./apps/socket/package.json
COPY --from=builder /app/apps/socket/dist ./apps/socket/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
COPY --from=builder /app/packages/types/dist ./packages/types/dist

RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD node -e "require('net').connect(3001).on('connect', () => process.exit(0)).on('error', () => process.exit(1))"

CMD ["node", "apps/socket/dist/apps/socket/index.js"]
