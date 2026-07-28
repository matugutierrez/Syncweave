import process from "node:process"

export const config = {
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? "0.0.0.0",
  dataDir: process.env.DATA_DIR ?? "./.syncweave-data",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  snapshotIntervalMs: 5_000,
  presenceTtlMs: 30_000,
} as const
