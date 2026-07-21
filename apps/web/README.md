# @repo/web

TanStack Start app: shadcn/ui on Base UI + TanStack Query + typed API access via Eden.

```sh
bun run dev   # http://localhost:3000 (needs .env — see .env.example)
```

## Layout

- `src/routes/` — file-based routing
  - `login.tsx` — public sign-in / sign-up (better-auth email + password)
  - `_authed.tsx` — authenticated sidebar layout; redirects to `/login`
    without a session (`ssr: false` so loaders can call the API with cookies)
  - `_authed/todos/index.tsx` — todo list route
  - `_authed/todos/new.tsx` — create-todo route
- `src/lib/api.ts` — Eden treaty client typed by `@repo/server`'s `App` type
- `src/lib/session.ts` — Start server function reading the better-auth
  session with forwarded cookies (used in the root route's `beforeLoad`)
- `src/lib/todos.ts` — TanStack Query options, mutation hooks, and success toasts
- `src/components/app-sidebar.tsx` — customized `sidebar-04` navigation block
- `src/components/ui/` — Base UI-backed shadcn/ui components, including the
  responsive sidebar and Sonner notifications (`bunx shadcn@latest add …`)

The API base URL comes from `VITE_SERVER_URL` and is embedded at build time.
Build the production image from the repository root with:

```sh
docker build -f apps/web/Dockerfile \
  --build-arg VITE_SERVER_URL=https://api.example.com \
  -t elysia-tanstack-dashboard-monorepo-web .
```
