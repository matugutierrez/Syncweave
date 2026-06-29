import { type ID, idCompare, idEquals, idToString } from "./id"
import type { JSONValue, InsertOp, DeleteOp } from "./operations"

/**
 * A single node in the sequence CRDT.
 *
 * Items form a doubly-linked list. Deleted items are kept as tombstones so
 * that concurrent operations referencing them (by origin) still integrate
 * deterministically. `originLeft`/`originRight` capture the *causal* neighbours
 * at insertion time, which is what YATA's integration rule needs.
 */
export interface Item {
  id: ID
  originLeft: ID | null
  originRight: ID | null
  content: JSONValue
  deleted: boolean
  left: Item | null
  right: Item | null
}

/**
 * SequenceCRDT — a YATA (Yet Another Transformation Approach) ordered sequence,
 * the same family of algorithm Yjs uses.
 *
 * The hard part is `integrate`: when two clients insert between the same two
 * neighbours concurrently, every replica must pick the SAME final order. YATA
 * achieves this by scanning the run of conflicting items and using the origin
 * relationships plus a total order on ids to decide where the new item lands
 * — with no central coordinator and no transformation of operations.
 */
export class SequenceCRDT {
  /** All items by id (including tombstones), for O(1) origin lookups. */
  private readonly items = new Map<string, Item>()
  /** Sentinel head; real items start at head.right. */
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

  /**
   * Integrate a remote or local insert. This is the convergence-critical
   * routine. Idempotent: re-applying a known op is a no-op.
   */
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

    // Scan candidate position between (left, right), resolving concurrent
    // inserts that share an origin using the YATA rule.
    let scan = left ? left.right : this.head.right
    let dest = left

    while (scan !== null && scan !== right) {
      const scanOriginLeft = this.get(scan.originLeft)
      const scanOriginRight = this.get(scan.originRight)

      // Item's origin is to the left of scan's origin → we must insert before.
      if (this.precedesOrigin(left, scanOriginLeft)) {
        break
      }

      if (idEquals(scan.originLeft, op.originLeft)) {
        // Same left origin: break ties by id total order.
        if (idCompare(scan.id, op.id) > 0) {
          break
        }
        // Equal right origin region — keep scanning past smaller ids.
        if (idEquals(scan.originRight, op.originRight) === false) {
          // continue scanning
        }
      }

      dest = scan
      scan = scan.right
    }

    this.linkAfter(dest, item)
    this.items.set(idToString(item.id), item)
  }

  /**
   * True if origin `a` strictly precedes origin `b` in the current list.
   * Used to decide when a scanned item belongs to a different insertion slot.
   */
  private precedesOrigin(a: Item | null, b: Item | null): boolean {
    if (b === null) return false
    if (a === null) return true
    // Walk right from a; if we reach b, a precedes b.
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

  /** Apply a delete op by tombstoning the referenced item. Idempotent. */
  integrateDelete(op: DeleteOp): void {
    const item = this.get(op.ref)
    if (item) item.deleted = true
  }

  /** Materialize the visible (non-tombstoned) content as an array. */
  toArray(): JSONValue[] {
    const out: JSONValue[] = []
    let cur = this.head.right
    while (cur) {
      if (!cur.deleted) out.push(cur.content)
      cur = cur.right
    }
    return out
  }

  /** Visible content as a string (assumes single-char string content). */
  toString(): string {
    let s = ""
    let cur = this.head.right
    while (cur) {
      if (!cur.deleted && typeof cur.content === "string") s += cur.content
      cur = cur.right
    }
    return s
  }

  /** The id of the visible item at index `i`, or null. Used for local edits. */
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

  /**
   * Resolve the (originLeft, originRight) pair for a local insertion at a
   * given visible index. originLeft is the visible item before the index;
   * originRight is the next item (visible or not) so concurrent inserts share
   * a stable right anchor.
   */
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
