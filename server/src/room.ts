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

  sync(client: Client, remoteVV: Record<ClientID, number>): void {
    const remote = VersionVector.fromJSON(remoteVV)
    const missing = this.history.filter(
      (op) => !remote.has(op.id.client, op.id.clock),
    )
    client.socket.send(
      encode({ t: "sync-response", ops: missing, vv: this.version.toJSON() }),
    )
  }

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

  async flush(): Promise<number> {
    if (this.dirty.length === 0) return 0
    const batch = this.dirty
    this.dirty = []
    await this.persistence.append(this.id, batch)
    return batch.length
  }
}
