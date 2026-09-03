# syntax=docker/dockerfile:1
# Produção: Clouds2Africa / cluster em Angola (ADR 0001). Não usar Vercel/AWS para PII.

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
ENV PORT=5000
ENV BASE_PATH=/
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/brokerhub-angola run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV FRONTEND_DIST=/app/public
RUN useradd --system --uid 10001 brokerhub
COPY --from=build /app/artifacts/api-server/dist ./dist
COPY --from=build /app/artifacts/brokerhub-angola/dist/public ./public
USER brokerhub
EXPOSE 5000
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
