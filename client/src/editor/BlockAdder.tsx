import { useState } from "react"

interface BlockAdderProps {
  onAdd: (type: string) => void
}

export function BlockAdder({ onAdd }: BlockAdderProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (type: string) => {
    onAdd(type)
    setOpen(false)
  }

  return (
    <div className="group relative flex items-center justify-center py-0.5">
      <div
        className="absolute inset-x-0 h-px opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "var(--border)" }}
      />
      <button
        onClick={() => setOpen(!open)}
        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-xs transition-all hover:scale-110"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        +
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="animate-fade-in absolute left-6 top-6 z-40 w-44 rounded-xl border py-1 shadow-xl"
            style={{
              background: "var(--bg-panel)",
              borderColor: "var(--border)",
            }}
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Add block
            </p>
            {[
              { type: "paragraph", label: "Text", icon: "¶" },
              { type: "heading1", label: "Heading 1", icon: "H1" },
              { type: "heading2", label: "Heading 2", icon: "H2" },
              { type: "heading3", label: "Heading 3", icon: "H3" },
              { type: "bullet-list", label: "Bullet list", icon: "•" },
              { type: "numbered-list", label: "Numbered list", icon: "1." },
              { type: "todo", label: "To-do", icon: "☐" },
              { type: "code-block", label: "Code block", icon: "<>" },
              { type: "quote", label: "Quote", icon: "\"" },
              { type: "divider", label: "Divider", icon: "—" },
            ].map((bt) => (
              <button
                key={bt.type}
                onClick={() => handleSelect(bt.type)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-mono"
                  style={{ background: "var(--bg)" }}
                >
                  {bt.icon}
                </span>
                {bt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
