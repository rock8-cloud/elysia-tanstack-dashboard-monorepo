---
name: rock8cloud-code-review
description: Fetches the AI code review Rock8Cloud ran on the current branch or pull request, validates each finding against the real code, fixes the valid ones and reports why the rest were rejected. Use when the user asks to check, address, apply or fix the Rock8Cloud review, code review feedback or review findings for a branch or PR.
---

# Act on a Rock8Cloud code review

Rock8Cloud reviews pull request diffs with AI and posts the findings on the PR. This skill pulls those findings into the working session. Needs the rock8cloud MCP server connected (skill `rock8cloud-setup`).

## 1. Identify the branch

Run these locally:

```bash
git rev-parse --abbrev-ref HEAD
git remote get-url origin
git rev-parse HEAD
```

Make sure the branch is pushed and a pull request is open. Reviews run on PR events, not on local commits.

## 2. Fetch the review

Call `get_code_reviews` with:

- `branch` (required) - the current branch name.
- `repoUrl` (recommended) - the origin URL. It scopes results to the right repo and tells you whether this account hosts the repo at all.
- `organizationId` (optional) - restricts the search to one organization. Without it every organization the token can see is searched, so no organization lookup is needed.

Each entry in `results` has the `service`, the `environment` (`branch`, `pullRequestNumber`) and a `codeReview` with `status`, `commitSha`, `summary`, `criticalCount`, `warningCount`, `suggestionCount`, `filesAnalyzed`, `partial`, `hasVisualDoc` and `findings`. `partial: true` means the reviewer stopped before finishing, so the findings are real but the review may be incomplete. `hasInProgressReview` is `true` while a newer review is still running.

`codeReview` holds the latest completed findings. `latestReview` identifies the newest review overall with `id`, `status` and `retryable`, including failed reviews. Use `latestReview.retryable`, not an older completed review's `partial` flag, to decide whether a retry is allowed.

When the user asks to retry and `latestReview.retryable` is `true`, call `retry_code_review` with `organizationId`, `serviceId` (`service.id`) and `reviewId` (`latestReview.id`). It reviews the current PR head. For a partial review at the same commit, it resumes recorded unreviewed files and keeps earlier findings. Otherwise it reviews the whole PR, including a failed review or a partial review whose head moved. The response's `resumed` field is `true` when a resume was queued and `false` when a full review was queued. Report which mode was queued, not that it has completed. Fetch `get_code_reviews` again for the new result.

Each finding has `id`, `severity` (`critical`, `warning` or `suggestion`), `category`, `bestPractice`, `file`, `line`, `title`, `description`, `suggestion` and `fixPrompt`.

## 3. If nothing comes back

`results` is empty and `message` says why. Typical causes and fixes:

- Branch never pushed, or no pull request open - push and open a PR.
- The repo is not hosted in any organization this token can access - check the account, or the GitHub App installation (skill `rock8cloud-setup`).
- A review is still running (`hasInProgressReview: true`) - wait a minute and call again.
- Reviews are off - the user enables the AI Code Review workflow in the service's Workflows tab. AI workflows stay disabled until the organization turns on AI features.

## 4. Check freshness

Compare `codeReview.commitSha` with `git rev-parse HEAD`. If they differ, the review covers an older commit. Push the latest work, wait for the new review (a push triggers one) and fetch again before acting.

## 5. Validate before fixing

Treat findings as guidance, not orders. For each one:

1. Open `file` at `line` and read the surrounding code.
2. Decide if the problem is real in the current code. Reject it if it is already handled, refers to code that has changed, misreads intent or conflicts with a project convention.
3. For valid findings, apply the fix. `suggestion` is a human hint and `fixPrompt` is a ready made instruction you can follow directly. Keep each change minimal and in scope.
4. Run the project's tests, linter and type checks.

5. For each finding you verified as wrong, call `dismiss_code_review_finding` with `organizationId`, `serviceId` (`service.id`), `reviewId` (`codeReview.id`), `findingId` and a concrete `reason` (1-255 characters) naming the code that proves it wrong. The next review sees the reason and does not raise the finding again unless the code changes in a way that invalidates it. Never dismiss a finding you did not verify.

Work through `critical` first, then `warning`, then `suggestion`. Do not silence a finding by weakening a check.

## 6. Report and push

Tell the user, per finding, whether it was fixed or rejected and why, in one line each. Commit and push only when the user wants that. The push triggers a fresh review, so call `get_code_reviews` again and confirm the counts dropped and nothing new appeared.

## Notes

- The full visual report (summary, changed files, diff walkthrough) is in the dashboard under the service's Code Reviews tab. Link the user there when `hasVisualDoc` is `true`.
- Findings carry `disposition` (`open`, `dismissed`, `sent` or `fixed`) and `dismissReason`. Skip ones already dismissed.
- A rejected finding that keeps coming back can also be dismissed in the dashboard with Don't flag this again. That adds a learning the reviewer follows on later runs.
- The dashboard also has Send to agent, which hands selected findings to a cloud coding agent on the PR branch.

## Docs

- https://docs.rock8.cloud/docs/guides/code-reviews.md
- https://docs.rock8.cloud/docs/guides/mcp-integration.md
