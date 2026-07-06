import type { CRDTDocument, UndoManager } from "@syncweave/crdt"

interface ToolbarProps {
  doc: CRDTDocument
  undo: UndoManager
  onAddBlock: (type: string) => void
}

export function Toolbar({ doc: _doc, undo, onAddBlock }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
      <button
        className="rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] sm:px-3 sm:py-1.5 sm:text-sm"
        style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
        onClick={() => onAddBlock("paragraph")}
      >
        + Text
      </button>
      <button
        className="rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] sm:px-3 sm:py-1.5 sm:text-sm"
        style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
        onClick={() => onAddBlock("heading1")}
      >
        + Heading
      </button>
      <button
        className="rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] sm:px-3 sm:py-1.5 sm:text-sm"
        style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
        onClick={() => onAddBlock("bullet-list")}
      >
        + List
      </button>
      <button
        className="rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] sm:px-3 sm:py-1.5 sm:text-sm"
        style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
        onClick={() => onAddBlock("todo")}
      >
        + Todo
      </button>
      <button
        className="rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] sm:px-3 sm:py-1.5 sm:text-sm"
        style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
        onClick={() => onAddBlock("code-block")}
      >
        + Code
      </button>
      <div className="mx-0.5 h-4 w-px sm:mx-1 sm:h-5" style={{ background: "var(--border)" }} />
      <button
        className="rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30 sm:px-3 sm:py-1.5 sm:text-sm"
        style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
        onClick={() => undo.undo()}
        disabled={!undo.canUndo}
      >
        ↩ Undo
      </button>
      <button
        className="rounded-lg px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-30 sm:px-3 sm:py-1.5 sm:text-sm"
        style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
        onClick={() => undo.redo()}
        disabled={!undo.canRedo}
      >
        ↪ Redo
      </button>
    </div>
  )
}
