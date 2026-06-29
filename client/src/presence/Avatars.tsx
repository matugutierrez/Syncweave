import type { CSSProperties } from "react"
import type { Awareness } from "@syncweave/crdt"

/** Stacked avatar bubbles for everyone currently in the room. */
export function Avatars({ awareness }: { awareness: Awareness }) {
  const states = [...awareness.getRemoteStates().values()]
  const me = awareness.getLocalUpdate().state
  const all = [me, ...states]

  return (
    <div className="flex -space-x-2">
      {all.map((s, i) => {
        const style: CSSProperties = { backgroundColor: s.color }
        return (
          <div
            key={i}
            title={s.name}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink text-xs font-semibold text-white"
            style={style}
          >
            {s.name.slice(0, 2).toUpperCase()}
          </div>
        )
      })}
    </div>
  )
}
