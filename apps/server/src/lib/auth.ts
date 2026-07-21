import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db/client";
import * as schema from "../db/schema";
import { env } from "../env";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  trustedOrigins: [env.corsOrigin],
  emailAndPassword: {
    enabled: true,
  },
  // To add an OIDC/OAuth provider, configure it here and re-run
  // `bun run auth:generate` + `bun run db:generate` if the schema changes:
  // socialProviders: {
  //   github: { clientId: env.githubClientId, clientSecret: env.githubClientSecret },
  // },
});
