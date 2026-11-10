---
name: rock8cloud-deploy
description: Deploys any GitHub repository to Rock8Cloud, writing a Dockerfile first when the repo has none, and manages it afterwards, including environment variables, managed PostgreSQL, Redis and S3 storage, custom domains, preview environments, resizing and rollback. Use when the user wants to deploy, ship, host or put an app live, add a database, set environment variables, attach a domain, check what is running, or roll back a bad release on Rock8Cloud.
---

# Deploy a repository to Rock8Cloud

Needs the rock8cloud MCP server connected (skill `rock8cloud-setup`). Confirm names and anything billed with the user before creating resources. Tools marked `confirmed` must only get `confirmed: true` after the user explicitly agrees in the conversation.

## 1. Prepare the repo

Rock8Cloud builds from a Dockerfile, but the user does not need one. Look for it at the repo root or in the app's folder. If there is none, you write it. That is part of the deploy, not a blocker to report.

1. Detect the stack from the manifest and lockfile (`package.json` with `bun.lock`, `pnpm-lock.yaml` or `package-lock.json`, `pyproject.toml` or `requirements.txt`, `go.mod`, `Gemfile`, `Cargo.toml`, `pom.xml` or `build.gradle`, `composer.json`) and read its build and start scripts.
2. Write a multi-stage Dockerfile: install from the lockfile, build, then copy only the output into a slim runtime stage. Pin the base image to the version the project uses (`engines`, `.nvmrc`, `.python-version`, `go.mod`).
3. The app must listen on `0.0.0.0` on the port in `EXPOSE <port>`, and the image needs a `CMD` or `ENTRYPOINT`. Set `ENV HOST=0.0.0.0` and `ENV PORT=<port>` when the framework reads them.
4. Add a `.dockerignore` (`.git`, `node_modules`, build output, `.env*`). Secrets never go into the image, they are set as environment variables in step 3.
5. If Docker is available locally, run `docker build .` and fix any error before pushing.
6. Show the user the Dockerfile, then commit and push it to the branch you will deploy. Builds pull from the remote, not the working tree.

Recipes that work on the first try:

- **Static SPA or site** (Vite, React, Vue, Astro static): build, then `nginx:alpine` with the output in `/usr/share/nginx/html`, `EXPOSE 80`. For client-side routing add an nginx config with `try_files $uri $uri/ /index.html`.
- **Next.js**: set `output: "standalone"` in `next.config`, copy `.next/standalone`, `.next/static` and `public`, run `node server.js` with `ENV HOSTNAME=0.0.0.0`, `EXPOSE 3000`.
- **Node or Bun server** (Express, Fastify, Hono, Elysia, NestJS, SvelteKit, Nuxt or Astro with the node adapter): run the production start command and read `PORT`. Use `oven/bun` for Bun projects with `bun install --frozen-lockfile`.
- **Python**: `python:<version>-slim`, install from the lockfile, run `uvicorn main:app --host 0.0.0.0 --port 8000` or `gunicorn -b 0.0.0.0:8000`.
- **Go**: build with `CGO_ENABLED=0`, copy the binary into `alpine` or `distroless/static`.

Variables the framework inlines at build time (`VITE_*`, `NEXT_PUBLIC_*`, `PUBLIC_*`) are passed as Docker build args. Declare each with `ARG <NAME>` in the build stage and set it with `stage: "build"` in step 3.

Use the `EXPOSE` port as `containerPort`. If the app has a health route such as `/health`, pass it as `healthEndpoint`. In a monorepo put the Dockerfile in the app's folder and pass its path relative to the repo root as `dockerfileLocation`.

Only if you cannot edit the repo (no file access), point the user to the dashboard: ticking **Generate Dockerfile** when creating the service makes a Rock8Cloud agent write one in a pull request. That option is not available over MCP.

## 2. Create the service

1. `list_organizations` for `organizationId`.
2. `check_github_connection` (see `rock8cloud-setup`).
3. `create_project` with `organizationId` and `name` (suggest the repo name), or reuse one from `list_projects` and `get_project`.
4. `list_branches` with `organizationId`, `repoOwner`, `repoName`. Default to the current branch.
5. `create_repo_service` with `organizationId`, `projectId`, `name`, `repoUrl` (`https://github.com/owner/repo`), `branch`, `dockerfileLocation`, `containerPort` (a string such as `"3000"`). Optional: `externalUrl` (a name, not a URL, so `my-app` gives `my-app.rock8cloud.app`), `healthEndpoint` (such as `/health`), `dependencyScanEnabled`, `publicAccessEnabled`, `autoDeploy`.

Creating a service never deploys it. The result has `serviceId` and `fullUrl`. Pass `autoDeploy: false` only when the user wants agents working on the repo without it going live, because it also stops pushes from deploying.

## 3. Databases and environment variables

Provision before the first deploy if the app needs data. Each call takes `organizationId` and `projectId`, plus an optional `name`, and returns `serviceId` and `deploymentId` with status `pending`.

- `provision_postgres` with optional `version` such as `"17"`.
- `provision_redis` (Dragonfly, Redis compatible) with optional `version`.
- `provision_object_storage` (private, S3 compatible) with optional `storageGb`.

Poll `get_deployment_status` until the database is live. Then wire credentials into the app:

1. `list_linkable_keys` with `organizationId` and the database `serviceId`. It lists exported keys such as `HOST`, `PASSWORD` and `URL`.
2. `link_env_vars` with `targetServiceId` (the app), `sourceServiceId` (the database, same project) and `keys: [{ sourceKey, targetKey? }]`. Use `targetKey` to rename, for example `URL` to `DATABASE_URL`. Secrets resolve at deploy time and are never exposed.

For plain values use `write_manual_env_vars` with `serviceId`, `confirmed: true` and `envVars: [{ key, value, stage? }]` where `stage` is `runtime` (default) or `build`. Values may be secrets, so show the user the exact key and value pairs first. Never invent secrets. `get_env_vars` lists what is set with manual values masked as `***`. `unlink_env_vars` removes links.

None of these redeploy. Call `deploy_service` afterwards. Databases are reachable only from services in the same project.

## 4. Deploy and watch

`deploy_service` with `organizationId` and `serviceId` returns at once with `deploymentId`, `status: "pending"` and `url`.

- `blocked: true` means it did not start. Report `limitType`, `reason`, `current`, `limit` and `tier`. For `limitType: "resources"` the organization pool is full, so free capacity (shrink, sleep or delete a service) or ask the user to upgrade or buy add-ons. Do not retry blindly.
- Build minute, AI budget, storage and subscription limits surface later as a failed deployment.

Poll `get_deployment_status` with `organizationId`, `serviceId`, `deploymentId` every 15 to 30 seconds. `statusInfo.kind` moves through `queued`, `building`, `deploying`, `starting`, then `live`. Terminal states are `live` (raw `deployed`), `failed` and `cancelled`. A first build usually takes 2 to 5 minutes.

- `live`: give the user the URL and confirm it responds. `get_uptime_status` shows monitor state.
- `degraded`: serving, but pods keep crashing. Read the runtime logs (skill `rock8cloud-logs`).
- `failed`: follow skill `rock8cloud-logs`. If you wrote the Dockerfile, the fix is yours. Read the first real error in `get_build_logs` (or the runtime logs when the build passed but the app never came up), fix the Dockerfile or the app, commit and push. If `get_latest_build` shows no new build for that commit within a minute, call `deploy_service`. Repeat up to five attempts, then show the user the last error and what you tried.
- `dependencyScan` lists critical vulnerabilities with fixed versions when scanning is enabled. Critical findings block the build. `list_vulnerabilities` shows the latest stable scan of every service in the organization, or of one with `serviceId`.

After the first deploy, pushes to the tracked branch redeploy automatically (the Deploy on Push workflow) unless `autoDeploy` was `false`.

## 5. Custom domain

`add_custom_domain` with `serviceId` and `domain` (such as `app.example.com`, no wildcards). The result lists the DNS records for the user to create at their DNS provider: a CNAME (preferred, not valid on a root domain) or an A record (plus optional AAAA), and a TXT record at `_rock8cloud-challenge.<host>`. Then call `verify_custom_domain` with the `domainId` from `list_custom_domains`, or wait about 60 seconds for automatic checks. Status moves `pending` to `verified` and TLS is issued automatically. One domain per service, stable environment only. `remove_custom_domain` needs `confirmed`.

## 6. Previews

With the Preview Deployments workflow on (the default, source branch pattern `feat/*`), every pull request gets its own environment. `list_environments` returns `stable` and `previews[]` with `previewUrl`, `pullRequestNumber` and `serviceState`. Previews use the stable environment variables. If a preview is missing, the workflow is off or the branch does not match. The user can comment `@<github-app> preview <service-name>` on the pull request to force one. To debug a preview build, call `get_latest_build` with `environmentType: "preview"`.

## 7. Operate

- `get_project` and `list_services` show `isDeployed` and `serviceState`.
- `edit_service` changes repo, branch, Dockerfile, port, health check, address or public access. It needs `confirmed` and applies on the next deploy. Changing `externalUrl` moves the live address, so warn the user to update variables that contain it, such as `PUBLIC_URL` or `CORS_ORIGIN`.
- Sizing: `get_deployment_metrics`, `get_resource_pool`, then `set_service_resources` with `cpuMillis`, `memoryMib` and `confirmed`. It restarts the service and can change the bill.
- `delete_service` and `delete_project` are permanent and need `confirmed`.

## Rollback

There is no MCP tool for it. Tell the user to open the service's deployment history in the dashboard, select an earlier deployment and click Rollback. It redeploys the previously built image without a rebuild. The first deployment cannot be rolled back. The alternative is to revert the bad commit and push.

## Docs

- https://docs.rock8.cloud/docs/first-deployment.md
- https://docs.rock8.cloud/docs/dockerfile-requirements.md
- https://docs.rock8.cloud/docs/adding-a-database.md
- https://docs.rock8.cloud/docs/guides/environment-variables.md
- https://docs.rock8.cloud/docs/guides/custom-domains.md
- https://docs.rock8.cloud/docs/guides/preview-deployments.md
- https://docs.rock8.cloud/docs/guides/rollback-deployments.md
- https://docs.rock8.cloud/docs/guides/mcp-integration.md
