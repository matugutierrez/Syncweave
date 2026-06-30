import { useToast } from "@/lib/toast"

interface ShareDialogProps {
  roomId: string
  onClose: () => void
}

export function ShareDialog({ roomId, onClose }: ShareDialogProps) {
  const url = `${window.location.origin}/#/${roomId}`
  const addToast = useToast((s) => s.add)

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(
      () => addToast("Link copied to clipboard", "success"),
      () => addToast("Failed to copy link", "error"),
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-fade-in mx-4 w-full max-w-sm rounded-xl p-6 shadow-2xl"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold">Share document</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Anyone with this link can view and edit
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono"
            style={{
              background: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Copy
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--text-muted)" }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
