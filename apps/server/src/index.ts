import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { bootstrapDatabase } from "./db/bootstrap";
import { env } from "./env";
import { authPlugin } from "./plugins/auth";
import { todosRoutes } from "./routes/todos";

await bootstrapDatabase();

const app = new Elysia()
  .use(cors({ origin: env.corsOrigin, credentials: true }))
  .use(authPlugin)
  .get("/health", () => ({ status: "ok" }))
  .use(todosRoutes)
  .listen(env.port);

console.log(`🦊 API running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
