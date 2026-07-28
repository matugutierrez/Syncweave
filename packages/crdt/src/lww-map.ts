import { type Timestamp, timestampCompare } from "./clock"
import type { JSONValue, SetOp } from "./operations"

interface Register {
  value: JSONValue
  ts: Timestamp
}

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
