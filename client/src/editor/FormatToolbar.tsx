interface FormatToolbarProps {
  top: number
  left: number
  onClose: () => void
}

export function FormatToolbar({ top, left, onClose }: FormatToolbarProps) {
  return (
    <>
      <div
        className="fixed z-50 flex gap-1 rounded-lg border px-1.5 py-1 shadow-xl animate-fade-in"
        style={{
          top,
          left,
          background: "var(--bg-panel)",
          borderColor: "var(--border)",
        }}
      >
        <button
          className="rounded px-2 py-1 text-sm font-bold transition-colors hover:bg-[var(--bg-hover)]"
          title="Bold"
          onClick={() => {
            document.execCommand("bold")
            onClose()
          }}
        >
          B
        </button>
        <button
          className="rounded px-2 py-1 text-sm italic transition-colors hover:bg-[var(--bg-hover)]"
          title="Italic"
          onClick={() => {
            document.execCommand("italic")
            onClose()
          }}
        >
          I
        </button>
        <button
          className="rounded px-2 py-1 text-sm underline transition-colors hover:bg-[var(--bg-hover)]"
          title="Underline"
          onClick={() => {
            document.execCommand("underline")
            onClose()
          }}
        >
          U
        </button>
        <div className="mx-1 w-px" style={{ background: "var(--border)" }} />
        <button
          className="rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
          title="Inline code"
          onClick={() => {
            document.execCommand("insertHTML", false, `<code>${window.getSelection()?.toString() ?? ""}</code>`)
            onClose()
          }}
        >
          {"<>"}
        </button>
        <button
          className="rounded px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
          title="Strikethrough"
          onClick={() => {
            document.execCommand("strikeThrough")
            onClose()
          }}
        >
          S
        </button>
      </div>
      <div className="fixed inset-0 z-40" onClick={onClose} />
    </>
  )
}
