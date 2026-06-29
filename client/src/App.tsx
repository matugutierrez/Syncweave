import { useMemo, useState } from "react"
import { useSyncWeave } from "@/sync/useSyncWeave"
import { EditableBlock } from "@/editor/EditableBlock"
import { RemoteCursors } from "@/presence/RemoteCursors"
import { Avatars } from "@/presence/Avatars"
import { Toolbar } from "@/components/Toolbar"
import { StatusBar } from "@/components/StatusBar"

function useRoom(): string {
  return useMemo(() => {
    const hash = window.location.hash.replace(/^#/, "")
    if (hash) return hash
    const id = Math.random().toString(36).slice(2, 8)
    window.location.hash = id
    return id
  }, [])
}

export function App() {
  const room = useRoom()
  const [name] = useState(
    () => `User ${Math.floor(Math.random() * 1000)}`,
  )
  const { doc, awareness, undo, status } = useSyncWeave(room, name)

  // `revision` from the hook drives re-render; read the latest snapshot here.
  const blocks = doc.childrenOf("root")

  const handleCaret = (blockId: string, caret: number) => {
    awareness.setLocalState({ blockId, cursor: caret, selection: null })
  }

  const handleAddBlock = (type: string) => {
    doc.addBlock(type)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">SyncWeave</h1>
          <p className="text-sm text-white/50">
            Room <span className="font-mono">{room}</span> — share the URL to
            collaborate
          </p>
        </div>
        <Avatars awareness={awareness} />
      </header>

      <div className="flex items-center justify-between">
        <Toolbar doc={doc} undo={undo} onAddBlock={handleAddBlock} />
        <StatusBar status={status} pending={doc.pendingOps} />
      </div>

      <main className="flex flex-col gap-1 rounded-xl bg-panel/60 p-6 ring-1 ring-white/10">
        {blocks.length === 0 && (
          <p className="text-white/40">Loading document…</p>
        )}
        {blocks.map((block) => (
          <div key={block.id} className="relative">
            <RemoteCursors awareness={awareness} blockId={block.id} />
            <EditableBlock
              doc={doc}
              undo={undo}
              blockId={block.id}
              type={block.type}
              text={block.text.toString()}
              onCaret={handleCaret}
            />
          </div>
        ))}
      </main>

      <footer className="text-center text-xs text-white/30">
        Built on a from-scratch CRDT engine · open two tabs to see real-time
        merge
      </footer>
    </div>
  )
}
