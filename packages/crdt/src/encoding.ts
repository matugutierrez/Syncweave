import type { ClientID } from "./id"
import type { Operation } from "./operations"
import type { PresenceState } from "./awareness"

export type Message =
  | { t: "hello"; room: string; name?: string }
  | { t: "sync-request"; room: string; vv: Record<ClientID, number> }
  | { t: "sync-response"; ops: Operation[]; vv: Record<ClientID, number> }
  | { t: "ops"; ops: Operation[] }
  | { t: "awareness"; client: ClientID; clock: number; state: PresenceState | null }
  | { t: "error"; message: string }

export function encode(msg: Message): string {
  return JSON.stringify(msg)
}

export function decode(raw: string | Uint8Array): Message {
  if (typeof raw === "string") return JSON.parse(raw) as Message
  return JSON.parse(new TextDecoder().decode(raw)) as Message
}
