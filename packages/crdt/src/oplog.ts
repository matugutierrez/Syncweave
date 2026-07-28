import { type ID, idToString } from "./id"
import { VersionVector } from "./clock"
import {
  type Operation,
  opDependencies,
} from "./operations"

export class OpLog {
  private readonly version = new VersionVector()
  private readonly applied = new Set<string>()
  private readonly pending = new Map<string, Operation[]>()
  private readonly history: Operation[] = []

  constructor(private readonly onReady: (op: Operation) => void) {}

  private isApplied(id: ID): boolean {
    return this.applied.has(idToString(id)) || this.version.has(id.client, id.clock)
  }

  private dependenciesMet(op: Operation): ID | null {
    for (const dep of opDependencies(op)) {
      if (!this.isApplied(dep)) return dep
    }
    return null
  }

  receive(op: Operation): void {
    if (this.isApplied(op.id)) return

    const missing = this.dependenciesMet(op)
    if (missing) {
      const key = idToString(missing)
      const list = this.pending.get(key) ?? []
      list.push(op)
      this.pending.set(key, list)
      return
    }

    this.release(op)
    this.drainPending(op.id)
  }

  private release(op: Operation): void {
    this.applied.add(idToString(op.id))
    this.version.observe(op.id.client, op.id.clock)
    this.history.push(op)
    this.onReady(op)
  }

  private drainPending(justApplied: ID): void {
    const key = idToString(justApplied)
    const waiters = this.pending.get(key)
    if (!waiters) return
    this.pending.delete(key)
    for (const op of waiters) {
      if (this.dependenciesMet(op) === null && !this.isApplied(op.id)) {
        this.release(op)
        this.drainPending(op.id)
      } else if (!this.isApplied(op.id)) {
        // Still missing another dependency — re-buffer under the new one.
        this.receive(op)
      }
    }
  }

  operationsSince(remote: VersionVector): Operation[] {
    return this.history.filter(
      (op) => !remote.has(op.id.client, op.id.clock),
    )
  }

  getVersion(): VersionVector {
    return this.version.clone()
  }

  get size(): number {
    return this.history.length
  }

  get pendingCount(): number {
    let n = 0
    for (const list of this.pending.values()) n += list.length
    return n
  }
}
