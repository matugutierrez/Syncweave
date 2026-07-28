import { type ID, idCompare, idEquals, idToString } from "./id"
import type { JSONValue, InsertOp, DeleteOp } from "./operations"
export interface Item {
  id: ID
  originLeft: ID | null
  originRight: ID | null
  content: JSONValue
  deleted: boolean
  left: Item | null
  right: Item | null
}

export class SequenceCRDT {
  private readonly items = new Map<string, Item>()
  private readonly head: Item

  constructor() {
    this.head = {
      id: { client: "\u0000", clock: 0 },
      originLeft: null,
      originRight: null,
      content: null,
      deleted: true,
      left: null,
      right: null,
    }
  }

  private get(id: ID | null): Item | null {
    if (id === null) return null
    return this.items.get(idToString(id)) ?? null
  }

  integrateInsert(op: InsertOp): void {
    if (this.items.has(idToString(op.id))) return // already integrated

    const left = this.get(op.originLeft)
    const right = this.get(op.originRight)

    const item: Item = {
      id: op.id,
      originLeft: op.originLeft,
      originRight: op.originRight,
      content: op.content,
      deleted: false,
      left: null,
      right: null,
    }

    let scan = left ? left.right : this.head.right
    let dest = left

    while (scan !== null && scan !== right) {
      const scanOriginLeft = this.get(scan.originLeft)
      const scanOriginRight = this.get(scan.originRight)

      if (this.precedesOrigin(left, scanOriginLeft)) {
        break
      }

      if (idEquals(scan.originLeft, op.originLeft)) {
        if (idCompare(scan.id, op.id) > 0) {
          break
        }
        if (idEquals(scan.originRight, op.originRight) === false) {
        }
      }

      dest = scan
      scan = scan.right
    }

    this.linkAfter(dest, item)
    this.items.set(idToString(item.id), item)
  }

  private precedesOrigin(a: Item | null, b: Item | null): boolean {
    if (b === null) return false
    if (a === null) return true
    let cur: Item | null = a.right
    while (cur) {
      if (cur === b) return true
      cur = cur.right
    }
    return false
  }

  private linkAfter(dest: Item | null, item: Item): void {
    const prev = dest ?? this.head
    const next = prev.right
    prev.right = item
    item.left = prev === this.head ? null : prev
    item.right = next
    if (next) next.left = item
  }

  integrateDelete(op: DeleteOp): void {
    const item = this.get(op.ref)
    if (item) item.deleted = true
  }

  toArray(): JSONValue[] {
    const out: JSONValue[] = []
    let cur = this.head.right
    while (cur) {
      if (!cur.deleted) out.push(cur.content)
      cur = cur.right
    }
    return out
  }

  toString(): string {
    let s = ""
    let cur = this.head.right
    while (cur) {
      if (!cur.deleted && typeof cur.content === "string") s += cur.content
      cur = cur.right
    }
    return s
  }

  visibleIdAt(index: number): ID | null {
    let cur = this.head.right
    let i = 0
    while (cur) {
      if (!cur.deleted) {
        if (i === index) return cur.id
        i += 1
      }
      cur = cur.right
    }
    return null
  }

  originsForIndex(index: number): { left: ID | null; right: ID | null } {
    let cur = this.head.right
    let prev: Item | null = null
    let i = 0
    while (cur && i < index) {
      if (!cur.deleted) i += 1
      prev = cur
      cur = cur.right
    }
    return {
      left: prev ? prev.id : null,
      right: cur ? cur.id : null,
    }
  }

  get length(): number {
    let n = 0
    let cur = this.head.right
    while (cur) {
      if (!cur.deleted) n += 1
      cur = cur.right
    }
    return n
  }
}
