import { treaty } from "@elysiajs/eden";
import type { App } from "@repo/server";

import { env } from "./env";

/**
 * Type-safe Eden client for the Elysia API. Request/response types are
 * inferred end-to-end from the server's route definitions.
 */
export const api = treaty<App>(env.serverUrl, {
  fetch: { credentials: "include" },
});
