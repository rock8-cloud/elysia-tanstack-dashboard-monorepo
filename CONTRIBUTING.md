# Contributing

Thanks for improving the blueprint. Keep changes small, documented, and useful
to more than one application.

## Local setup

1. Install Bun 1.3.14 or newer and Docker.
2. Follow the setup in [README.md](README.md).
3. Create a branch from `main`.
4. Run `bun run validate` before opening a pull request.

## Pull requests

- Explain the problem and the trade-offs behind the solution.
- Add or update tests for changed behavior.
- Update documentation and `.env.example` files when configuration changes.
- Never commit credentials, local `.env` files, generated build output, or
  database volumes.
- Generate Drizzle migrations through `bun run db:generate`; do not edit them
  manually.

Changes to backend features should preserve the route → service → query
layering described in the README.

## Reporting security issues

Do not open a public issue. Follow [SECURITY.md](SECURITY.md).
