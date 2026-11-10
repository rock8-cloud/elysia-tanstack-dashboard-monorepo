---
name: rock8cloud-setup
description: Connects an AI coding agent to Rock8Cloud through its remote MCP server at https://app.rock8.cloud/mcp, then verifies the login and GitHub access. Use when the user wants to set up, authorize or troubleshoot Rock8Cloud in Claude Code, Cursor, Codex, Grok, Grok Bot, Grok Build, OpenCode, Pi, Zed or another MCP client, when rock8cloud tools are missing or fail with auth errors, or before any other Rock8Cloud task on a fresh machine.
---

# Connect an agent to Rock8Cloud

Rock8Cloud is a cloud platform for deploying apps, reviewing code, running coding agents in sandboxes and watching logs. It exposes a remote MCP server so an agent can operate all of it. Endpoint: `https://app.rock8.cloud/mcp` (Streamable HTTP, OAuth 2.0).

## 1. Check the current state

If tools such as `list_organizations` and `deploy_service` are already available, the server is connected. Skip to step 3.

## 2. Add the server

Claude on the web, Claude Desktop or the Claude mobile app: Rock8Cloud is a connector in the Claude directory, and only the user can add it. Send them to https://claude.ai/directory/rock8cloud (or Customize → Connectors → + → Rock8Cloud) and have them click Connect. It then works in every Claude app on their account.

Grok on grok.com: only the user can add it. Send them to https://grok.com/connectors, New Connector → Custom, Name `rock8cloud`, Server URL `https://app.rock8.cloud/mcp`, Add Connector, then the sign-in popup.

Grok Bot: a separate connection from Grok. Have the user send `Add an MCP server for rock8cloud https://app.rock8.cloud/mcp` in a Grok Bot chat, pick **Yes, add it**, click **Continue** on the rock8cloud card and finish the sign-in popup.

Claude Code:

```bash
claude mcp add rock8cloud --transport http https://app.rock8.cloud/mcp
```

Or in the project's `.mcp.json`:

```json
{ "mcpServers": { "rock8cloud": { "type": "http", "url": "https://app.rock8.cloud/mcp" } } }
```

OpenAI Codex CLI:

```bash
codex mcp add rock8cloud --url https://app.rock8.cloud/mcp
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.rock8cloud]
url = "https://app.rock8.cloud/mcp"
```

In the Codex and ChatGPT apps, `open_dashboard` and the `show_*` tools (`show_service`, `show_usage`, `show_pages`, `show_vulnerabilities`) render live views in the chat. Other clients get the same data as text.

Grok Build (xAI's terminal coding agent):

```bash
grok mcp add --transport http rock8cloud https://app.rock8.cloud/mcp
```

Or in `~/.grok/config.toml` (`.grok/config.toml` for one project):

```toml
[mcp_servers.rock8cloud]
url = "https://app.rock8.cloud/mcp"
```

It also loads the project's `.mcp.json` and `.cursor/mcp.json`, so an existing Claude Code or Cursor entry works as is. The browser sign-in opens on first use. Check with `grok mcp doctor rock8cloud`.

Cursor and other clients that read an `mcpServers` JSON file (for Cursor, `.cursor/mcp.json`):

```json
{ "mcpServers": { "rock8cloud": { "url": "https://app.rock8.cloud/mcp" } } }
```

OpenCode, in `opencode.json`, then run `opencode mcp auth`:

```json
{ "mcp": { "rock8cloud": { "type": "remote", "url": "https://app.rock8.cloud/mcp" } } }
```

Pi needs the adapter first: `pi install npm:pi-mcp-adapter`. Then add to `.mcp.json`:

```json
{ "mcpServers": { "rock8cloud": { "url": "https://app.rock8.cloud/mcp", "auth": "oauth" } } }
```

Restart Pi and run `/mcp-auth rock8cloud`.

Zed and IntelliJ have no native remote HTTP support, so bridge through `mcp-remote`:

```json
{ "mcpServers": { "rock8cloud": { "command": "npx", "args": ["-y", "mcp-remote", "https://app.rock8.cloud/mcp"] } } }
```

(In Zed the top-level key is `context_servers` inside `.zed/settings.json`.)

Any other client that supports remote MCP servers with OAuth (VS Code and others) needs only the URL. A client without remote support can use the same `mcp-remote` bridge.

On first use the client opens a browser consent screen. Only the user can approve it. Tell them to approve, then restart the client or reload its MCP servers if the tools do not appear. Check with `claude mcp list` (Claude Code) or `/mcp` (Pi).

## 3. Verify the login

Call `list_organizations`. It returns `id`, `name`, `slug`, `tier` and `subscriptionStatus` per organization. The `id` is the `organizationId` that nearly every other tool requires. With one organization use it, with several ask the user which. An auth error here means the token expired or consent was not completed, so re-run the client's OAuth step.

## 4. Verify GitHub access

Apps deploy from GitHub through the Rock8Cloud GitHub App. Take the owner and name from `git remote get-url origin`, then call `check_github_connection` with `organizationId`, `repoOwner`, `repoName`.

- `accessible: true` - ready.
- `accessible: false` with an `installUrl` - give the URL to the user to install or authorize the GitHub App, then call again.
- `accessible: false` with `configureStatus: available` and a `configureUrl` - show that URL so the user can configure or request repository access on GitHub. GitHub decides what changes or requests their permissions allow. The link does not grant access to the repository.
- `configureStatus: unavailable` or `unknown` - relay `configureReason`. Do not invent a configuration URL. `unknown` means verification failed, not confirmed denial. Checks are cached briefly. After changing GitHub permissions, wait up to a minute before checking again.
- `accessible: false` without an available configuration or installation URL - relay the message, then call again once the user has acted. When the installation is not linked to the organization, the user links it in Rock8Cloud under Settings > GitHub App Setup. Only the user's own personal GitHub account is linked automatically, into the personal organization created when they first signed in, while they still own it.

`list_git_owners` (`list_github_owners` is a deprecated alias) returns `owners` that pass your GitHub owner-access preflight for blueprints. `unavailableOwners` explains linked accounts you cannot currently select. An empty `owners` list does not necessarily mean the App is uninstalled. Relay any reasons instead of telling the user to reinstall. When no owner is eligible, the result carries `connectUrl`: give it to the user, and the GitHub account they install on is linked to the organization when they finish. The link expires in 15 minutes. Configuration/request permission is separate from blueprint access. When `owners` is empty and `hostedGit.available` is true, the user can skip GitHub: `create_repo_service` without `repoUrl` creates a hosted repo and returns `git` push credentials (`get_git_credentials` mints a new 24 hour token).

## API keys (REST API only)

The MCP server accepts OAuth only. For scripts and CI that call the REST API at `https://app.rock8.cloud/api`, the user creates a key in the dashboard under Settings > API Keys > New key. Pick the narrowest scopes, copy the `vhk_...` token immediately (it is shown once) and send it as `Authorization: Bearer vhk_...`. A key belongs to one organization and can be revoked at any time. Never commit keys.

## Troubleshooting

- `401 UNAUTHORIZED` - token expired or missing, so re-authorize in the client.
- `403 INSUFFICIENT_SCOPE` - the token lacks the scope named in `required`. Re-authorize and approve it. A token never gets more than the user's role in the organization allows.
- `JWKSNoMatchingKey` through `mcp-remote` - the cached OAuth state is stale. Run `rm -rf ~/.mcp-auth` and authorize again.
- `402 USAGE_LIMIT_EXCEEDED` - a plan limit was reached. Tell the user which one the response names.

## Next

- Ship an app: skill `rock8cloud-deploy`.
- Start from a template: skill `rock8cloud-prototype`.

Docs: https://docs.rock8.cloud/docs/guides/mcp-integration.md and https://docs.rock8.cloud/docs/guides/api-keys.md
