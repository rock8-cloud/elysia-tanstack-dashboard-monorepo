---
name: rock8cloud-logs
description: Diagnoses Rock8Cloud services by reading deployment status, build logs, runtime logs, CPU and memory metrics and uptime history, and walks a failed build from root cause to a fix. Use when a deploy or build failed, an app crashes, returns errors or is slow, runs out of memory, shows as down, or the user asks what is happening in production on Rock8Cloud.
---

# Debug with Rock8Cloud logs and health

Needs the rock8cloud MCP server connected (skill `rock8cloud-setup`). All tools take `organizationId` from `list_organizations`. Find `serviceId` with `list_services` (needs a `projectId` from `list_projects`).

## Which tool

| Question | Tool |
| --- | --- |
| Did the last deploy work? What is its build job? | `get_latest_build` |
| What is the state of one deployment? | `get_deployment_status` |
| Why did the build fail? | `get_build_logs_by_build_id` or `get_build_logs` |
| What is the running app printing or crashing on? | `get_runtime_logs` |
| Is it short of CPU or memory? | `get_deployment_metrics` |
| Is it reachable? | `get_uptime_status` |
| Which services have critical vulnerabilities? | `list_vulnerabilities` (latest stable scan, services with scanning on) |

## Failed build, step by step

1. `get_latest_build` with `serviceId`. Optional `environmentType` is `stable` (default) or `preview` (the most recent preview). It returns `deploymentId`, `status`, `commitSha`, `commitMessage`, `branch`, `buildJobId`, `buildStatus` and `buildResult`.
2. `get_build_logs_by_build_id` with `buildJobId`. Or `get_build_logs` with `serviceId` and `deploymentId`. Start with `level: "error"`. If it returns an error because nothing matched a filter, call again without `search` and `level` to get the full log.
3. Find the root cause, which is usually the first real error and not the last line. Common ones: a missing or wrong Dockerfile path, a failing install or compile step, a `COPY` path that is not in the build context, a dependency scan blocking critical vulnerabilities (see `dependencyScan` in `get_deployment_status`).
4. Fix it in the code or Dockerfile and run the build locally if possible.
5. Commit and push. Pushes to the tracked branch redeploy through Deploy on Push. If that workflow is off, call `deploy_service`.
6. Poll `get_deployment_status` with `serviceId` and `deploymentId` until it reaches `live`, `failed` or `cancelled`. Repeat from step 1 if it fails again.

Tell the user the root cause in plain words, what you changed and the final status.

## Log parameters

`get_build_logs`, `get_build_logs_by_build_id` and `get_runtime_logs` share:

- `limit` - 1 to 500 lines, default 100.
- `search` - case-insensitive literal substring, for example `"UserNotFoundException"`.
- `level` - one of `debug`, `info`, `warn`, `error`, `fatal`, `critical`, `trace`, `unknown`.

`get_runtime_logs` also takes `deploymentId` (omit it for the active deployment, pass an older one to inspect a past release), `sinceMinutes`, `untilMinutes`, and `start` and `end` as nanosecond timestamps that override the minutes. Logs come newest first. Read the code first, find the exact messages it emits, then search for those phrases. Use `level: "error"` or `"fatal"` for crashes and outages, `warn` for degraded behavior, and `info` or `debug` only to trace a flow.

Build logs are not runtime logs. A build that passed but an app that will not start needs runtime logs.

## App deployed but unhealthy

1. `get_deployment_status`. `statusInfo.kind` of `degraded` means serving but pods keep crashing, `starting` for a long time usually means the health check never passes.
2. `get_runtime_logs` for the crash or boot error.
3. Typical causes: the app listens on `localhost` instead of `0.0.0.0`, the port differs from the Dockerfile `EXPOSE` and the service `containerPort`, a missing environment variable (`get_env_vars` lists keys, values are masked), or a database not linked (`list_linkable_keys`, `link_env_vars`, then redeploy).
4. `get_uptime_status` returns `status` (`UP` or `DOWN`), `uptimeRatio`, `averageLatencyInMs`, `lastCheck` and 30 days of outage `history`. `configured: false` means no monitor, and `paused: true` means public access is off.

## Slow or killed (resources)

`get_deployment_metrics` with `deploymentId` and `range` of `1h` (default), `6h` or `24h` summarizes CPU and memory as average, p95, max and latest, in absolute units and as a percent of the limit, plus `oomEvents` and `deployments`. Add `includeSeries: true` for raw points.

- Sustained p95 above about 80% of the limit, or any out of memory kill, means grow.
- p95 well under about 30% means it can shrink.
- Check `get_resource_pool` for headroom, then `set_service_resources` with `serviceId`, `cpuMillis`, `memoryMib` and `confirmed: true`. Ask the user to approve the exact new size first, because it restarts the service and can change the bill.

## Docs

- https://docs.rock8.cloud/docs/how-deployments-work.md
- https://docs.rock8.cloud/docs/dockerfile-requirements.md
- https://docs.rock8.cloud/docs/guides/mcp-integration.md
