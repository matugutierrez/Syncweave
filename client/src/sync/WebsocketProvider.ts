import {
  type CRDTDocument,
  type Operation,
  type Awareness,
  type Message,
  encode,
  decode,
} from "@syncweave/crdt"
import { config } from "@/config"

export type ConnectionStatus = "connecting" | "online" | "offline"

export class WebsocketProvider {
  private socket: WebSocket | null = null
  private status: ConnectionStatus = "connecting"
  private backoff = 500
  private readonly maxBackoff = 15_000
  private outbox: Operation[] = []
  private readonly statusListeners = new Set<(s: ConnectionStatus) => void>()
  private awarenessTimer: number | null = null
  private disposed = false

  constructor(
    private readonly room: string,
    private readonly doc: CRDTDocument,
    private readonly awareness: Awareness,
    private readonly name: string = "Anonymous",
  ) {
    this.doc.onChange((ops) => {
      this.outbox.push(...ops.filter((o) => o.id.client === this.doc.clientID))
      this.flushOutbox()
    })
    this.awareness.onChange(() => this.sendAwareness())
    this.connect()
  }


  private connect(): void {
    if (this.disposed) return
    this.setStatus("connecting")
    const url = `${config.wsUrl}/sync?client=${encodeURIComponent(
      this.doc.clientID,
    )}`
    const socket = new WebSocket(url)
    this.socket = socket

    socket.onopen = () => {
      this.backoff = 500
      this.send({ t: "hello", room: this.room, name: this.name })
      this.send({
        t: "sync-request",
        room: this.room,
        vv: this.doc.version.toJSON(),
      })
      this.setStatus("online")
      this.flushOutbox()
      this.sendAwareness()
      this.startAwarenessHeartbeat()
    }

    socket.onmessage = (ev) => this.handle(decode(ev.data))
    socket.onclose = () => this.scheduleReconnect()
    socket.onerror = () => socket.close()
  }

  private scheduleReconnect(): void {
    this.setStatus("offline")
    this.stopAwarenessHeartbeat()
    if (this.disposed) return
    const delay = Math.min(this.backoff, this.maxBackoff)
    this.backoff = Math.min(this.backoff * 2, this.maxBackoff)
    window.setTimeout(() => this.connect(), delay)
  }


  private handle(msg: Message): void {
    switch (msg.t) {
      case "sync-response":
        this.doc.applyRemote(msg.ops)
        // After catching up, push anything the server is missing from us.
        this.flushOutbox(true)
        break
      case "ops":
        this.doc.applyRemote(msg.ops)
        break
      case "awareness":
        if (msg.state === null) this.awareness.removeClient(msg.client)
        else
          this.awareness.applyRemote({
            client: msg.client,
            clock: msg.clock,
            state: msg.state,
          })
        break
      default:
        break
    }
  }

  private flushOutbox(force = false): void {
    if (this.status !== "online" || !this.socket) return
    if (this.outbox.length === 0 && !force) return
    if (this.outbox.length > 0) {
      this.send({ t: "ops", ops: this.outbox })
      this.outbox = []
    }
  }

  private sendAwareness(): void {
    if (this.status !== "online") return
    const update = this.awareness.getLocalUpdate()
    this.send({
      t: "awareness",
      client: update.client,
      clock: update.clock,
      state: update.state,
    })
  }

  private startAwarenessHeartbeat(): void {
    this.stopAwarenessHeartbeat()
    this.awarenessTimer = window.setInterval(() => {
      this.awareness.expire()
      this.sendAwareness()
    }, 10_000)
  }

  private stopAwarenessHeartbeat(): void {
    if (this.awarenessTimer !== null) {
      window.clearInterval(this.awarenessTimer)
      this.awarenessTimer = null
    }
  }

  private send(msg: Message): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(encode(msg))
    }
  }


  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return
    this.status = status
    for (const l of this.statusListeners) l(status)
  }

  onStatus(listener: (s: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    listener(this.status)
    return () => this.statusListeners.delete(listener)
  }

  dispose(): void {
    this.disposed = true
    this.stopAwarenessHeartbeat()
    this.socket?.close()
  }
}
