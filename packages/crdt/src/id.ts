/**
 * Globally-unique identifiers for CRDT items.
 *
 * Every item produced by a client carries a dotted ID `(client, clock)` where
 * `clock` is a monotonically increasing Lamport-style counter local to the
 * client. The pair is globally unique and provides a total order used to
 * deterministically break ties between concurrent operations.
 */

export type ClientID = string

export interface ID {
  readonly client: ClientID
  readonly clock: number
}

export function createID(client: ClientID, clock: number): ID {
  return { client, clock }
}

export function idEquals(a: ID | null, b: ID | null): boolean {
  if (a === null || b === null) return a === b
  return a.client === b.client && a.clock === b.clock
}

/**
 * Total order over IDs. Concurrent items are ordered first by client id
 * (lexicographically) then by clock. This guarantees every replica resolves
 * ties identically — the property that makes the CRDT convergent.
 */
export function idCompare(a: ID, b: ID): number {
  if (a.client < b.client) return -1
  if (a.client > b.client) return 1
  return a.clock - b.clock
}

export function idToString(id: ID): string {
  return `${id.client}@${id.clock}`
}

export function idFromString(s: string): ID {
  const at = s.lastIndexOf("@")
  if (at === -1) throw new Error(`Invalid ID string: ${s}`)
  return {
    client: s.slice(0, at),
    clock: Number(s.slice(at + 1)),
  }
}

/** Generate a reasonably-unique client id for a new session. */
export function generateClientID(): ClientID {
  const rnd = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${time}-${rnd}`
}
