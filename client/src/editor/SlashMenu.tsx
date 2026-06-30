import { useEffect, useRef, useState } from "react"

interface SlashMenuProps {
  top: number
  left: number
  onSelect: (blockType: string) => void
  onClose: () => void
}

const BLOCK_TYPES = [
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
]

export function SlashMenu({ top, left, onSelect, onClose }: SlashMenuProps) {
  const [selected, setSelected] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelected((s) => (s + 1) % BLOCK_TYPES.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelected((s) => (s - 1 + BLOCK_TYPES.length) % BLOCK_TYPES.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        onSelect(BLOCK_TYPES[selected]!.type)
      } else if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [selected, onSelect, onClose])

  return (
    <div
      ref={ref}
      className="slash-menu fixed z-50 w-52 rounded-xl border py-1 shadow-2xl"
      style={{
        top,
        left,
        background: "var(--bg-panel)",
        borderColor: "var(--border)",
      }}
    >
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Blocks
      </p>
      {BLOCK_TYPES.map((bt, i) => (
        <button
          key={bt.type}
          className={`slash-menu-item flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
            i === selected ? "selected" : ""
          }`}
          style={{ color: i === selected ? "white" : "var(--text)" }}
          onClick={() => onSelect(bt.type)}
          onMouseEnter={() => setSelected(i)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-mono" style={{ background: "var(--bg)" }}>
            {bt.icon}
          </span>
          {bt.label}
        </button>
      ))}
    </div>
  )
}
