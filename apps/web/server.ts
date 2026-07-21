import { join } from "node:path";

// @ts-expect-error The TanStack Start build output does not emit declarations.
import app from "./dist/server/server.js";

const clientDirectory = join(import.meta.dir, "dist/client");
const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" || request.method === "HEAD") {
      const pathname = decodeURIComponent(url.pathname);
      const relativePath = pathname.replace(/^\/+/, "");

      if (relativePath && !relativePath.includes("..")) {
        const file = Bun.file(join(clientDirectory, relativePath));
        if (await file.exists()) {
          return new Response(request.method === "HEAD" ? null : file, {
            headers: {
              "cache-control": pathname.startsWith("/assets/")
                ? "public, max-age=31536000, immutable"
                : "public, max-age=3600",
              "content-type": file.type,
            },
          });
        }
      }
    }

    return app.fetch(request);
  },
});

console.log(`Web running at http://localhost:${port}`);
