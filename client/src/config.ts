const isRenderClient =
  typeof window !== "undefined" &&
  window.location.hostname === "syncweave-client.onrender.com"

const defaultApiUrl = isRenderClient
  ? "https://syncweave-server.onrender.com"
  : "http://localhost:8080"

export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? defaultApiUrl,
  wsUrl: import.meta.env.VITE_WS_URL ?? defaultApiUrl.replace(/^http/, "ws"),
} as const
