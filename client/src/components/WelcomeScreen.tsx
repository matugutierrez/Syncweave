import type { CRDTDocument } from "@syncweave/crdt"

interface WelcomeScreenProps {
  doc: CRDTDocument
  userName: string
}

export function WelcomeScreen({ doc, userName }: WelcomeScreenProps) {
  const handleStart = () => {
    const titleId = doc.addBlock("heading1")
    doc.insertText(titleId, 0, `Welcome to SyncWeave, ${userName}!`)
    const bodyId = doc.addBlock("paragraph")
    doc.insertText(bodyId, 0, "Start typing here, or type / to add a block...")
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6 sm:p-12">
      <div className="animate-fade-in max-w-md text-center">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] sm:mb-3 sm:text-xs" style={{ color: "var(--text-muted)" }}>
          Empty document
        </p>
        <h1 className="mb-2 text-2xl font-semibold tracking-[-0.04em] sm:mb-3 sm:text-3xl">Start with a clean page</h1>
        <p className="mb-6 text-xs leading-6 sm:mb-8 sm:text-sm sm:leading-7" style={{ color: "var(--text-muted)" }}>
          Real-time collaborative editor. Share this URL with anyone to start
          editing together — no sign-up needed.
        </p>
        <button
          onClick={handleStart}
          className="rounded-xl bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover sm:px-6 sm:py-3 sm:text-sm"
        >
          Start writing
        </button>
        <p className="mt-3 text-[10px] sm:mt-4 sm:text-xs" style={{ color: "var(--text-muted)" }}>
          Type <kbd className="rounded bg-[var(--bg-hover)] px-1.5 py-0.5 font-mono">/</kbd> for commands
        </p>
      </div>
    </div>
  )
}
