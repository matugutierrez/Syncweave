import type { ID, ClientID } from "./id"
import type { Timestamp } from "./clock"


export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

export interface InsertOp {
  type: "insert"
  id: ID
  originLeft: ID | null
  originRight: ID | null
  target: string
  content: JSONValue
}

export interface DeleteOp {
  type: "delete"
  id: ID
  target: string
  ref: ID
}

export interface SetOp {
  type: "set"
  id: ID
  target: string
  key: string
  value: JSONValue
  ts: Timestamp
}

export interface AddBlockOp {
  type: "addBlock"
  id: ID
  blockId: string
  blockType: string
  parent: string
  order: string
}

export type Operation = InsertOp | DeleteOp | SetOp | AddBlockOp

export function opAuthor(op: Operation): ClientID {
  return op.id.client
}

export function opClock(op: Operation): number {
  return op.id.clock
}

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
