import type { CRDTDocument, UndoManager } from "@syncweave/crdt"

interface ToolbarProps {
  doc: CRDTDocument
  undo: UndoManager
  onAddBlock: (type: string) => void
}

export function Toolbar({ doc: _doc, undo, onAddBlock }: ToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
        onClick={() => onAddBlock("paragraph")}
      >
        + Paragraph
      </button>
      <button
        className="rounded bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
        onClick={() => onAddBlock("heading")}
      >
        + Heading
      </button>
      <div className="mx-1 h-5 w-px bg-white/10" />
      <button
        className="rounded bg-white/5 px-3 py-1 text-sm hover:bg-white/10 disabled:opacity-30"
        onClick={() => undo.undo()}
        disabled={!undo.canUndo}
      >
        Undo
      </button>
      <button
        className="rounded bg-white/5 px-3 py-1 text-sm hover:bg-white/10 disabled:opacity-30"
        onClick={() => undo.redo()}
        disabled={!undo.canRedo}
      >
        Redo
      </button>
    </div>
  )
}
