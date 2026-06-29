export const config = {
  wsUrl: import.meta.env.VITE_WS_URL ?? "ws://localhost:8080",
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
} as const
