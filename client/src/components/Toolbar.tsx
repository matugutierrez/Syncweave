import type { CRDTDocument, UndoManager } from "@syncweave/crdt"

interface ToolbarProps {
  doc: CRDTDocument
  undo: UndoManager
  onAddBlock: (type: string) => void
}

export function Toolbar({ doc: _doc, undo, onAddBlock }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        className="rounded-lg bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
        onClick={() => onAddBlock("paragraph")}
      >
        + Text
      </button>
      <button
        className="rounded-lg bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
        onClick={() => onAddBlock("heading1")}
      >
        + Heading
      </button>
      <button
        className="rounded-lg bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
        onClick={() => onAddBlock("bullet-list")}
      >
        + List
      </button>
      <button
        className="rounded-lg bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
        onClick={() => onAddBlock("todo")}
      >
        + Todo
      </button>
      <button
        className="rounded-lg bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10"
        onClick={() => onAddBlock("code-block")}
      >
        + Code
      </button>
      <div className="mx-1 h-5 w-px bg-white/10" />
      <button
        className="rounded-lg bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10 disabled:opacity-30"
        onClick={() => undo.undo()}
        disabled={!undo.canUndo}
      >
        ↩ Undo
      </button>
      <button
        className="rounded-lg bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10 disabled:opacity-30"
        onClick={() => undo.redo()}
        disabled={!undo.canRedo}
      >
        ↪ Redo
      </button>
    </div>
  )
}
