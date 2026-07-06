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
        className="animate-fade-in mx-3 w-full max-w-sm rounded-xl p-5 shadow-2xl sm:mx-4 sm:p-6"
        style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-base font-semibold sm:text-lg">Share document</h2>
        <p className="mb-3 text-xs sm:mb-4 sm:text-sm" style={{ color: "var(--text-muted)" }}>
          Anyone with this link can view and edit
        </p>
        <div className="flex gap-1.5 sm:gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 rounded-lg border px-2.5 py-2 text-xs font-mono sm:px-3 sm:text-sm"
            style={{
              background: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover sm:px-4 sm:text-sm"
          >
            Copy
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full rounded-lg py-2 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)] sm:mt-4 sm:text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
