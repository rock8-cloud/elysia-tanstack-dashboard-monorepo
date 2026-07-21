const serverUrl = import.meta.env.VITE_SERVER_URL;

if (!serverUrl) {
  throw new Error("Missing required environment variable: VITE_SERVER_URL");
}

export const env = {
  serverUrl,
};
