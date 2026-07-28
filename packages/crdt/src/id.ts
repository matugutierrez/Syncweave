
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

export function generateClientID(): ClientID {
  const rnd = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${time}-${rnd}`
}
