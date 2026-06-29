import type { ID, ClientID } from "./id"
import type { Timestamp } from "./clock"

/**
 * The wire/operation format. Every mutation in the system is expressed as one
 * of these immutable operations. Operations are the only thing exchanged
 * between replicas; applying the same set of operations in any order yields
 * the same document (commutativity + idempotency = convergence).
 */

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

/** Insert a character/element into a YATA sequence. */
export interface InsertOp {
  type: "insert"
  id: ID
  /** Item to the left at insertion time, or null for the head. */
  originLeft: ID | null
  /** Item to the right at insertion time, or null for the tail. */
  originRight: ID | null
  /** The sequence this insert belongs to (block id). */
  target: string
  content: JSONValue
}

/** Tombstone an existing sequence item (deletes never remove data). */
export interface DeleteOp {
  type: "delete"
  id: ID
  target: string
  /** The item being deleted. */
  ref: ID
}

/** Last-write-wins assignment to a keyed map (e.g. block attributes). */
export interface SetOp {
  type: "set"
  id: ID
  target: string
  key: string
  value: JSONValue
  ts: Timestamp
}

/** Create a new block node in the document tree. */
export interface AddBlockOp {
  type: "addBlock"
  id: ID
  blockId: string
  blockType: string
  parent: string
  /** Fractional order key within the parent. */
  order: string
}

export type Operation = InsertOp | DeleteOp | SetOp | AddBlockOp

export function opAuthor(op: Operation): ClientID {
  return op.id.client
}

export function opClock(op: Operation): number {
  return op.id.clock
}

/**
 * Causal dependencies of an operation: the IDs that must already be integrated
 * before this op can be applied. The op log uses this to buffer out-of-order
 * deliveries until they are causally ready.
 */
export function opDependencies(op: Operation): ID[] {
  switch (op.type) {
    case "insert": {
      const deps: ID[] = []
      if (op.originLeft) deps.push(op.originLeft)
      if (op.originRight) deps.push(op.originRight)
      return deps
    }
    case "delete":
      return [op.ref]
    case "set":
    case "addBlock":
      return []
  }
}
