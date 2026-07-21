# Build from the repository root:
# docker build -f apps/web/Dockerfile --build-arg VITE_SERVER_URL=https://api.example.com -t elysia-tanstack-dashboard-monorepo-web .
FROM oven/bun:1.3.14 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml turbo.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN bun install --frozen-lockfile

COPY apps/server apps/server
COPY apps/web apps/web
COPY packages packages
ARG VITE_SERVER_URL=http://localhost:3001
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
RUN bun --filter @repo/web build

FROM oven/bun:1.3.14-slim AS runtime
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/package.json ./package.json
COPY --from=build /app/apps/web/server.ts ./server.ts
COPY --from=build /app/apps/web/dist ./dist

EXPOSE 3000
CMD ["bun", "run", "server.ts"]
