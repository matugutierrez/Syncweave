import type { ClientID } from "./id"

export interface PresenceState {
  name: string
  color: string
  blockId: string | null
  cursor: number | null
  selection: [number, number] | null
}

interface RemoteEntry {
  clock: number
  state: PresenceState
  updatedAt: number
}

export class Awareness {
  private local: { client: ClientID; clock: number; state: PresenceState }
  private readonly remote = new Map<ClientID, RemoteEntry>()
  private readonly listeners = new Set<() => void>()
  private clockValue = 0

  constructor(
    readonly clientID: ClientID,
    initialState: PresenceState,
  ) {
    this.local = { client: clientID, clock: 0, state: initialState }
  }

  getLocalUpdate(): { client: ClientID; clock: number; state: PresenceState } {
    this.clockValue += 1
    this.local.clock = this.clockValue
    return { ...this.local, state: { ...this.local.state } }
  }

  setLocalState(partial: Partial<PresenceState>): void {
    this.local.state = { ...this.local.state, ...partial }
    this.trigger()
  }

  getRemoteStates(): Map<ClientID, PresenceState> {
    const out = new Map<ClientID, PresenceState>()
    for (const [client, entry] of this.remote) {
      out.set(client, entry.state)
    }
    return out
  }

  applyRemote(update: { client: ClientID; clock: number; state: PresenceState }): void {
    const existing = this.remote.get(update.client)
    if (existing && update.clock <= existing.clock) return
    this.remote.set(update.client, {
      clock: update.clock,
      state: update.state,
      updatedAt: Date.now(),
    })
    this.trigger()
  }

  removeClient(client: ClientID): void {
    if (this.remote.delete(client)) this.trigger()
  }

  expire(staleThreshold = 30_000): void {
    const now = Date.now()
    for (const [client, entry] of this.remote) {
      if (now - entry.updatedAt > staleThreshold) {
        this.remote.delete(client)
      }
    }
  }

  onChange(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private trigger(): void {
    for (const fn of this.listeners) fn()
  }
}
