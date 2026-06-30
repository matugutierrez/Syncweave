import { promises as fs } from "node:fs"
import path from "node:path"
import { config } from "./config"

const SNAPSHOT_DIR = path.join(config.dataDir, "snapshots")

export interface Snapshot {
  id: string
  roomId: string
  createdAt: string
  label: string
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true })
}

function snapshotsPath(roomId: string): string {
  return path.join(SNAPSHOT_DIR, `${roomId}.json`)
}

export async function listSnapshots(roomId: string): Promise<Snapshot[]> {
  try {
    const raw = await fs.readFile(snapshotsPath(roomId), "utf8")
    return JSON.parse(raw) as Snapshot[]
  } catch {
    return []
  }
}

export async function createSnapshot(
  roomId: string,
  ops: unknown[],
  label = `v${Date.now()}`,
): Promise<Snapshot> {
  await ensureDir()
  const snap: Snapshot = {
    id: `snap_${Date.now().toString(36)}`,
    roomId,
    createdAt: new Date().toISOString(),
    label,
  }
  const snaps = await listSnapshots(roomId)
  snaps.push(snap)
  await fs.writeFile(snapshotsPath(roomId), JSON.stringify(snaps, null, 2), "utf8")
  await fs.writeFile(
    path.join(SNAPSHOT_DIR, `${snap.id}.ndjson`),
    ops.map((o) => JSON.stringify(o)).join("\n") + "\n",
    "utf8",
  )
  return snap
}
