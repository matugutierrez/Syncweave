import type { ClientID } from "./id"

/**
 * A version vector (a.k.a. state vector) maps each client to the highest
 * contiguous clock value this replica has observed from that client.
 *
 * It is the compact summary a replica sends during sync so the peer can
 * compute exactly which operations it is missing ("give me everything after
 * what I already have").
 */
export class VersionVector {
  private readonly map = new Map<ClientID, number>()

  get(client: ClientID): number {
    return this.map.get(client) ?? 0
  }

  /** Record that we've now seen `(client, clock)`. Clocks are contiguous. */
  observe(client: ClientID, clock: number): void {
    const current = this.map.get(client) ?? 0
    if (clock > current) this.map.set(client, clock)
  }

  /** True if `(client, clock)` has already been integrated. */
  has(client: ClientID, clock: number): boolean {
    return clock <= this.get(client)
  }

  clients(): ClientID[] {
    return [...this.map.keys()]
  }

  toJSON(): Record<ClientID, number> {
    return Object.fromEntries(this.map)
  }

  static fromJSON(obj: Record<ClientID, number>): VersionVector {
    const vv = new VersionVector()
    for (const [client, clock] of Object.entries(obj)) {
      vv.observe(client, clock)
    }
    return vv
  }

  clone(): VersionVector {
    return VersionVector.fromJSON(this.toJSON())
  }
}

/**
 * Hybrid Logical Clock (HLC) — produces timestamps that respect causality
 * while staying close to physical wall-clock time. Used for the LWW map so
 * that "last write wins" is both causal and human-meaningful.
 */
export class HybridLogicalClock {
  private wall = 0
  private counter = 0

  now(): { wall: number; counter: number } {
    const physical = Date.now()
    if (physical > this.wall) {
      this.wall = physical
      this.counter = 0
    } else {
      this.counter += 1
    }
    return { wall: this.wall, counter: this.counter }
  }

  /** Merge a remote timestamp to keep clocks causally consistent. */
  update(remoteWall: number, remoteCounter: number): void {
    const physical = Date.now()
    const maxWall = Math.max(this.wall, remoteWall, physical)
    if (maxWall === this.wall && maxWall === remoteWall) {
      this.counter = Math.max(this.counter, remoteCounter) + 1
    } else if (maxWall === this.wall) {
      this.counter += 1
    } else if (maxWall === remoteWall) {
      this.counter = remoteCounter + 1
    } else {
      this.counter = 0
    }
    this.wall = maxWall
  }
}

export interface Timestamp {
  wall: number
  counter: number
  client: ClientID
}

/** Total order over HLC timestamps (ties broken by client id). */
export function timestampCompare(a: Timestamp, b: Timestamp): number {
  if (a.wall !== b.wall) return a.wall - b.wall
  if (a.counter !== b.counter) return a.counter - b.counter
  return a.client < b.client ? -1 : a.client > b.client ? 1 : 0
}
