# Build from the repository root:
# docker build -f apps/server/Dockerfile -t elysia-tanstack-dashboard-monorepo-server .
FROM oven/bun:1.3.14 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN bun install --frozen-lockfile

COPY apps/server apps/server
COPY packages/typescript-config packages/typescript-config
RUN bun --filter @repo/server build

FROM oven/bun:1.3.14-slim AS runtime
WORKDIR /app/apps/server
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/drizzle ./drizzle

EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]
