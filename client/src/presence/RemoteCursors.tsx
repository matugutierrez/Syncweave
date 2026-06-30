import type { CSSProperties } from "react"
import type { Awareness, ClientID, PresenceState } from "@syncweave/crdt"

interface RemoteCursorsProps {
  awareness: Awareness
  blockId: string
}

export function RemoteCursors({ awareness, blockId }: RemoteCursorsProps) {
  const remote: Array<[ClientID, PresenceState]> = [
    ...awareness.getRemoteStates().entries(),
  ].filter(([, s]) => s.blockId === blockId)

  return (
    <>
      {remote.map(([client, state]) => {
        if (state.cursor !== null) {
          const caretStyle: CSSProperties = {
            backgroundColor: state.color,
            transform: `translateX(${state.cursor * 8}px)`,
          }
          const labelStyle: CSSProperties = { backgroundColor: state.color }
          return (
            <span
              key={client}
              className="remote-cursor"
              data-name={state.name}
              style={caretStyle}
            >
              <span
                style={labelStyle}
                className="absolute -top-[1.3em] left-0 rounded px-1 text-[10px] text-white"
              >
                {state.name}
              </span>
            </span>
          )
        }
        if (state.selection) {
          const [start, end] = state.selection
          if (start !== end) {
            const selStyle: CSSProperties = {
              backgroundColor: state.color,
              left: `${Math.min(start, end) * 8}px`,
              width: `${Math.abs(end - start) * 8}px`,
              height: "1.2em",
            }
            return (
              <span
                key={client}
                className="remote-selection"
                style={selStyle}
                title={state.name}
              />
            )
          }
        }
        return null
      })}
    </>
  )
}
