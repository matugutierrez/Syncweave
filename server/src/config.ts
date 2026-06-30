import process from "node:process"

export const config = {
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? "0.0.0.0",
  dataDir: process.env.DATA_DIR ?? "./.syncweave-data",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  /** How often to persist dirty rooms to disk (ms). */
  snapshotIntervalMs: 5_000,
  /** Presence TTL (ms) before a disconnected client's cursor is dropped. */
  presenceTtlMs: 30_000,
} as const
