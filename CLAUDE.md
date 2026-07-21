# CLAUDE.md

Turborepo monorepo: Elysia API (`apps/server`) + TanStack Start web app
(`apps/web`) + Postgres (docker compose, host port 5434). Bun is the package
manager and runtime.

## Commands

- `bun run dev` — start everything (web :3000, api :3001)
- `bun run lint` / `bun run check-types` / `bun run build` — via turbo
- `bun run db:up` / `db:generate` / `db:migrate` / `db:studio`
- `bun run auth:generate` (in `apps/server`) — regenerate
  `src/db/schema/auth.ts` from the better-auth config

## Hard rules

- **Database queries live only in `apps/server/src/db/queries/`.** Never
  import the Drizzle client (`src/db/client.ts`) or `drizzle-orm` outside
  `src/db` — an oxlint `no-restricted-imports` rule fails the build if you do.
  (Exception: `src/lib/auth.ts` hands the client to better-auth's adapter.)
- **Layering in the server:** `routes/` validate input (typebox) and resolve
  auth, then call `services/`; `services/` hold business logic and call
  `db/queries/`. Don't skip layers.
- Scope queries by `userId` in the query itself, not in the route/service.
- Never hand-edit `apps/server/drizzle/` migrations or
  `src/db/schema/auth.ts` (generated). Schema changes: edit
  `src/db/schema/*.ts` → `db:generate` → `db:migrate`.
- Protected Elysia routes declare `{ auth: true }` (macro from
  `src/plugins/auth.ts`) and receive `user` in context.
- In the web app, everything under `src/routes/_authed/` requires a session;
  API calls go through the typed Eden client (`src/lib/api.ts`) wrapped in
  TanStack Query options/hooks (`src/lib/todos.ts`). Don't fetch manually.

## Conventions

- Lint: oxlint (root `.oxlintrc.json`, per-app overrides). Format: oxfmt
  (`bun run format`).
- Workspace packages are named `@repo/*`; apps depend on them via
  `workspace:*`.
- Env vars: validated at startup (`apps/server/src/env.ts`,
  `apps/web/src/lib/env.ts`). New vars go in `.env.example` too, and in
  `turbo.json` `env` if they affect builds.
- Bun uses the hoisted linker (`bunfig.toml`) so cross-package types (Eden's
  `App`) resolve to a single module instance.
