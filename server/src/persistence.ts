import { promises as fs } from "node:fs"
import path from "node:path"
import type { Operation } from "@syncweave/crdt"
import { config } from "./config"

/**
 * Append-only operation persistence with periodic snapshots.
 *
 * Each room is stored as a newline-delimited JSON log of operations. Because
 * operations are immutable and commutative, replaying the entire log rebuilds
 * the exact document state — the log IS the source of truth. Snapshots are an
 * optimization (a compacted starting point) layered on top later.
 */
export class Persistence {
  constructor(private readonly dir = config.dataDir) {}

  private logPath(room: string): string {
    const safe = room.replace(/[^a-zA-Z0-9_-]/g, "_")
    return path.join(this.dir, `${safe}.ndjson`)
  }

  async init(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true })
  }

  /** Load all persisted operations for a room (empty if none). */
  async load(room: string): Promise<Operation[]> {
    try {
      const raw = await fs.readFile(this.logPath(room), "utf8")
      return raw
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as Operation)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return []
      throw err
    }
  }

  /** Append newly committed operations to the room's log. */
  async append(room: string, ops: Operation[]): Promise<void> {
    if (ops.length === 0) return
    const payload = ops.map((op) => JSON.stringify(op)).join("\n") + "\n"
    await fs.appendFile(this.logPath(room), payload, "utf8")
  }
}
