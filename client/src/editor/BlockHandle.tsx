import { useState } from "react"

interface BlockHandleProps {
  blockId: string
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onTypeChange: (id: string, type: string) => void
}

const BLOCK_TYPES = [
  "paragraph", "heading1", "heading2", "heading3",
  "bullet-list", "numbered-list", "todo",
  "code-block", "quote", "divider",
]

export function BlockHandle({ blockId, onDelete, onDuplicate, onTypeChange }: BlockHandleProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="group absolute -left-8 top-0 flex h-full items-center sm:-left-10">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-6 w-6 items-center justify-center rounded-lg text-[10px] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--bg-hover)] sm:h-7 sm:w-7 sm:text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        ⠿
      </button>
      {open && (
        <div
          className="animate-fade-in absolute left-7 top-0 z-30 w-44 rounded-2xl border py-1 shadow-xl sm:left-8"
          style={{
            background: "var(--bg-panel)",
            borderColor: "var(--border)",
          }}
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => {
              onDuplicate(blockId)
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
          >
            Duplicate
          </button>
          <button
            onClick={() => {
              onDelete(blockId)
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: "var(--danger)" }}
          >
            Delete
          </button>
          <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Change type
          </p>
          {BLOCK_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => {
                onTypeChange(blockId, t)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-1 text-left text-xs transition-colors hover:bg-[var(--bg-hover)]"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
