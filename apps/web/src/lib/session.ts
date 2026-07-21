import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { authClient } from "./auth-client";

/**
 * Reads the current better-auth session from the API. Runs on the Start
 * server so the browser's cookies are forwarded during SSR as well as on
 * client-side navigations.
 */
export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const requestHeaders = getRequestHeaders();
  const cookie = requestHeaders.get("cookie");
  try {
    const { data } = await authClient.getSession({
      fetchOptions: {
        headers: cookie ? { cookie } : undefined,
      },
    });
    return data;
  } catch {
    // Keep the web service healthy while the API is starting or temporarily unavailable.
    return null;
  }
});
