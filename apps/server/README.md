# @repo/server

Elysia API on Bun. Auth via better-auth (cookie sessions, `/api/auth/*`),
data via Drizzle + Postgres.

```sh
bun run dev            # http://localhost:3001 (needs .env — see .env.example)
bun run db:generate    # create migration from schema changes
bun run db:migrate     # optional manual migration; startup also applies migrations
bun run db:seed        # optional manual seed using the configured SEED_* values
bun run auth:generate  # regenerate src/db/schema/auth.ts from lib/auth.ts
```

## Layout

- `src/routes/` — HTTP endpoints: typebox validation + `{ auth: true }` guard,
  delegate to services
- `src/services/` — business logic
- `src/db/` — the only place database access is allowed (enforced by oxlint):
  `client.ts` (Drizzle), `schema/`, `queries/`
- `src/plugins/auth.ts` — mounts better-auth + `auth` macro (session → 401)
- `src/lib/auth.ts` — better-auth config; add OIDC providers here
- `src/db/bootstrap.ts` — applies migrations and, when explicitly enabled,
  idempotently creates the environment-configured seed user before listening

No seed credentials are hardcoded. Set `SEED_DEFAULT_USER=true` and provide
`SEED_USER_NAME`, `SEED_USER_EMAIL`, and `SEED_USER_PASSWORD` to create one.

Build the production image from the repository root with
`docker build -f apps/server/Dockerfile -t elysia-tanstack-dashboard-monorepo-server .`.

The web app consumes this API type-safely: `export type App` in `src/index.ts`
is imported by Eden treaty in `apps/web`.
