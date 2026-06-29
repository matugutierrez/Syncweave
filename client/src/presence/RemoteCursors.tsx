import type { CSSProperties } from "react"
import type { Awareness, ClientID, PresenceState } from "@syncweave/crdt"

interface RemoteCursorsProps {
  awareness: Awareness
  blockId: string
}

/**
 * Renders the labelled carets of other collaborators currently editing this
 * block. Positions are approximate (character offset × average glyph width);
 * a production build would measure real glyph runs, but this conveys presence
 * convincingly and cheaply.
 */
export function RemoteCursors({ awareness, blockId }: RemoteCursorsProps) {
  const remote: Array<[ClientID, PresenceState]> = [
    ...awareness.getRemoteStates().entries(),
  ].filter(([, s]) => s.blockId === blockId && s.cursor !== null)

  return (
    <>
      {remote.map(([client, state]) => {
        const caretStyle: CSSProperties = {
          backgroundColor: state.color,
          transform: `translateX(${(state.cursor ?? 0) * 8}px)`,
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
      })}
    </>
  )
}
