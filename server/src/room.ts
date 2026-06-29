import type { WebSocket } from "ws"
import {
  type ClientID,
  type Operation,
  VersionVector,
  type Message,
  encode,
} from "@syncweave/crdt"
import type { Persistence } from "./persistence"

interface Client {
  socket: WebSocket
  clientID: ClientID
  name: string
}

/**
 * A Room is the authoritative relay for a single document.
 *
 * The server is intentionally "dumb": it does not need to understand the CRDT
 * semantics, only to (1) persist every operation it sees, (2) replay history
 * to newcomers based on their version vector, and (3) broadcast new operations
 * and presence to everyone else. Convergence is guaranteed by the CRDT itself,
 * so the server never has to resolve conflicts.
 */
export class Room {
  private readonly clients = new Set<Client>()
  private readonly version = new VersionVector()
  private readonly history: Operation[] = []
  private dirty: Operation[] = []

  constructor(
    readonly id: string,
    private readonly persistence: Persistence,
  ) {}

  async hydrate(): Promise<void> {
    const ops = await this.persistence.load(this.id)
    for (const op of ops) {
      this.history.push(op)
      this.version.observe(op.id.client, op.id.clock)
    }
  }

  add(client: Client): void {
    this.clients.add(client)
  }

  remove(client: Client): void {
    this.clients.delete(client)
    // Tell peers this client's presence is gone.
    this.broadcast(
      encode({
        t: "awareness",
        client: client.clientID,
        clock: Number.MAX_SAFE_INTEGER,
        state: null,
      }),
      client,
    )
  }

  get isEmpty(): boolean {
    return this.clients.size === 0
  }

  /** Send the catch-up operations a joining client is missing. */
  sync(client: Client, remoteVV: Record<ClientID, number>): void {
    const remote = VersionVector.fromJSON(remoteVV)
    const missing = this.history.filter(
      (op) => !remote.has(op.id.client, op.id.clock),
    )
    client.socket.send(
      encode({ t: "sync-response", ops: missing, vv: this.version.toJSON() }),
    )
  }

  /** Ingest operations from a client: dedupe, persist, broadcast. */
  ingest(ops: Operation[], from: Client): void {
    const fresh: Operation[] = []
    for (const op of ops) {
      if (this.version.has(op.id.client, op.id.clock)) continue
      this.version.observe(op.id.client, op.id.clock)
      this.history.push(op)
      this.dirty.push(op)
      fresh.push(op)
    }
    if (fresh.length === 0) return
    this.broadcast(encode({ t: "ops", ops: fresh }), from)
  }

  relayAwareness(raw: string, from: Client): void {
    this.broadcast(raw, from)
  }

  private broadcast(raw: string, except?: Client): void {
    for (const client of this.clients) {
      if (client === except) continue
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(raw)
      }
    }
  }

  /** Flush newly received ops to disk. Returns the count persisted. */
  async flush(): Promise<number> {
    if (this.dirty.length === 0) return 0
    const batch = this.dirty
    this.dirty = []
    await this.persistence.append(this.id, batch)
    return batch.length
  }
}
