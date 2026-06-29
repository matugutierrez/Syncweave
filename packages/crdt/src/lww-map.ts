import { type Timestamp, timestampCompare } from "./clock"
import type { JSONValue, SetOp } from "./operations"

interface Register {
  value: JSONValue
  ts: Timestamp
}

/**
 * A Last-Write-Wins map (LWW-Element-Map).
 *
 * Each key holds a register carrying the value and the HLC timestamp of the
 * write that produced it. On conflict the higher timestamp wins, with ties
 * broken deterministically by client id — so all replicas converge regardless
 * of delivery order. Used for block attributes (formatting, shape geometry,
 * colors, etc.).
 */
export class LWWMap {
  private readonly registers = new Map<string, Register>()

  apply(op: SetOp): void {
    const existing = this.registers.get(op.key)
    if (!existing || timestampCompare(op.ts, existing.ts) > 0) {
      this.registers.set(op.key, { value: op.value, ts: op.ts })
    }
  }

  get(key: string): JSONValue | undefined {
    return this.registers.get(key)?.value
  }

  has(key: string): boolean {
    return this.registers.has(key)
  }

  toObject(): Record<string, JSONValue> {
    const out: Record<string, JSONValue> = {}
    for (const [key, reg] of this.registers) out[key] = reg.value
    return out
  }

  keys(): string[] {
    return [...this.registers.keys()]
  }
}
