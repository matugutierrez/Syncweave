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
      <div className="animate-fade-in max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold">SyncWeave</h1>
        <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Real-time collaborative editor. Share this URL with anyone to start
          editing together — no sign-up needed.
        </p>
        <button
          onClick={handleStart}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Start writing
        </button>
        <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Type <kbd className="rounded bg-[var(--bg-hover)] px-1.5 py-0.5 font-mono">/</kbd> for commands
        </p>
      </div>
    </div>
  )
}
