import { Elysia } from "elysia";

import { auth } from "../lib/auth";

/**
 * Mounts the better-auth handler (all `/api/auth/*` endpoints) and exposes an
 * `auth` macro: routes declaring `{ auth: true }` receive `user` and `session`
 * in their context, or respond with 401 when no valid session exists.
 */
export const authPlugin = new Elysia({ name: "auth" }).mount(auth.handler).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({ headers });
      if (!session) {
        return status(401);
      }
      return { user: session.user, session: session.session };
    },
  },
});
