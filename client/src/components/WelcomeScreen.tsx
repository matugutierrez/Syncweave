import type { CRDTDocument } from "@syncweave/crdt"

interface WelcomeScreenProps {
  doc: CRDTDocument
  userName: string
}

export function WelcomeScreen({ doc, userName }: WelcomeScreenProps) {
  const handleStart = () => {
    doc.addBlock("heading1")
    const blocks = doc.childrenOf("root")
    if (blocks.length > 0) {
      doc.insertText(blocks[0]!.id, 0, `Welcome to SyncWeave, ${userName}!`)
    }
    doc.addBlock("paragraph")
    const blocks2 = doc.childrenOf("root")
    if (blocks2.length > 1) {
      doc.insertText(blocks2[1]!.id, 0, "Start typing here, or type / to add a block...")
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="animate-fade-in max-w-md text-center">
        <div className="mb-6 text-5xl">✨</div>
        <h1 className="mb-2 text-2xl font-bold">Welcome to SyncWeave</h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
          A real-time collaborative editor. Share the URL with anyone to start
          editing together — no sign-up required.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStart}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Start writing
          </button>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Type <kbd className="rounded bg-[var(--bg-hover)] px-1.5 py-0.5 font-mono">/</kbd> for commands
          </p>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-4 text-left text-xs" style={{ color: "var(--text-muted)" }}>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-1 text-lg">🔄</div>
            <div className="font-semibold" style={{ color: "var(--text)" }}>Real-time</div>
            <div>Edits merge instantly</div>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-1 text-lg">📡</div>
            <div className="font-semibold" style={{ color: "var(--text)" }}>Offline-first</div>
            <div>Works without internet</div>
          </div>
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
            <div className="mb-1 text-lg">🔒</div>
            <div className="font-semibold" style={{ color: "var(--text)" }}>End-to-end</div>
            <div>No servers store data</div>
          </div>
        </div>
      </div>
    </div>
  )
}
