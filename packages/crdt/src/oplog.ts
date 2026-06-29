import { type ID, idToString } from "./id"
import { VersionVector } from "./clock"
import {
  type Operation,
  opDependencies,
} from "./operations"

/**
 * Causal operation log.
 *
 * Networks reorder and duplicate messages. The op log guarantees **causal
 * delivery**: an operation is only handed to the document once every operation
 * it depends on has been applied. Out-of-order ops are buffered until their
 * dependencies arrive, then released transitively.
 */
export class OpLog {
  private readonly version = new VersionVector()
  private readonly applied = new Set<string>()
  /** Buffered ops waiting on a missing dependency id-string. */
  private readonly pending = new Map<string, Operation[]>()
  private readonly history: Operation[] = []

  constructor(private readonly onReady: (op: Operation) => void) {}

  /** True if this operation has already been integrated. */
  private isApplied(id: ID): boolean {
    return this.applied.has(idToString(id)) || this.version.has(id.client, id.clock)
  }

  private dependenciesMet(op: Operation): ID | null {
    for (const dep of opDependencies(op)) {
      if (!this.isApplied(dep)) return dep
    }
    return null
  }

  /** Receive an operation (local or remote) and release it when causally ready. */
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

  /** A new op just landed; see if it unblocks anything waiting on it. */
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

  /** Operations the peer is missing, given their version vector. */
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
