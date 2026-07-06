import { useCallback, useMemo, useState } from "react"
import { useSyncWeave } from "@/sync/useSyncWeave"
import { ThemeProvider } from "@/lib/theme"
import { useRouter } from "@/lib/router"
import { Layout } from "@/components/Layout"
import { ToastContainer } from "@/components/Toast"
import { WelcomeScreen } from "@/components/WelcomeScreen"
import { ShareDialog } from "@/components/ShareDialog"
import { EditableBlock } from "@/editor/EditableBlock"
import { BlockHandle } from "@/editor/BlockHandle"
import { BlockAdder } from "@/editor/BlockAdder"
import { RemoteCursors } from "@/presence/RemoteCursors"
import { Avatars } from "@/presence/Avatars"
import { Toolbar } from "@/components/Toolbar"
import { StatusBar } from "@/components/StatusBar"
import { Dashboard } from "@/pages/Dashboard"
import { toMarkdown, toHtml } from "@/lib/export"
import { useToast } from "@/lib/toast"

function RoomEditor({ room }: { room: string }) {
  const addToast = useToast((s) => s.add)
  const [name] = useState(() => `User ${Math.floor(Math.random() * 1000)}`)
  const { doc, awareness, undo, status, revision } = useSyncWeave(room, name)
  const [showShare, setShowShare] = useState(false)

  const blocks = useMemo(() => doc.childrenOf("root"), [doc, revision])
  const numberedIndexById = useMemo(() => {
    const indexes = new Map<string, number>()
    let current = 0
    for (const block of blocks) {
      if (block.type === "numbered-list") {
        current += 1
        indexes.set(block.id, current)
      }
    }
    return indexes
  }, [blocks])

  const handleCaret = useCallback(
    (blockId: string, caret: number) => {
      awareness.setLocalState({ blockId, cursor: caret, selection: null })
    },
    [awareness],
  )

  const handleAddBlock = useCallback(
    (type: string) => {
      const id = doc.addBlock(type)
      setTimeout(() => {
        const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null
        el?.focus()
      }, 0)
    },
    [doc],
  )

  const handleChangeType = useCallback(
    (blockId: string, newType: string) => {
      doc.setBlockType(blockId, newType)
    },
    [doc],
  )

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      doc.transact(() => {
        const block = blocks.find((b) => b.id === blockId)
        if (block) {
          const len = block.text.length
          if (len > 0) doc.deleteText(blockId, 0, len)
        }
      })
    },
    [doc, blocks],
  )

  const handleDuplicateBlock = useCallback(
    (blockId: string) => {
      const block = blocks.find((b) => b.id === blockId)
      if (!block) return
      const newId = doc.addBlock(block.type)
      const text = block.text.toString()
      if (text.length > 0) {
        doc.insertText(newId, 0, text)
      }
    },
    [doc, blocks],
  )

  const handleExportMarkdown = useCallback(() => {
    const md = toMarkdown(blocks)
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${room}.md`
    a.click()
    URL.revokeObjectURL(url)
    addToast("Exported as Markdown", "success")
  }, [blocks, room, addToast])

  const handleExportHtml = useCallback(() => {
    const html = toHtml(blocks)
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${room}.html`
    a.click()
    URL.revokeObjectURL(url)
    addToast("Exported as HTML", "success")
  }, [blocks, room, addToast])

  const isOpeningEmptyDocument = blocks.length === 0 && status === "connecting"

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] sm:text-xs" style={{ color: "var(--text-muted)" }}>
            Collaborative document
          </p>
          <h1 className="mt-1 max-w-3xl truncate text-lg font-semibold tracking-[-0.03em] sm:text-2xl">
            {room.startsWith("doc_") ? "Untitled document" : room}
          </h1>
          <p className="mt-1 font-mono text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>
            {room}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <div className="flex gap-0.5 sm:gap-1">
            <button
              onClick={handleExportMarkdown}
              className="rounded-lg px-2 py-1 text-[11px] transition-colors hover:bg-[var(--bg-hover)] sm:px-2.5 sm:py-1.5 sm:text-xs"
              style={{ color: "var(--text-muted)" }}
              title="Export Markdown"
            >
              MD
            </button>
            <button
              onClick={handleExportHtml}
              className="rounded-lg px-2 py-1 text-[11px] transition-colors hover:bg-[var(--bg-hover)] sm:px-2.5 sm:py-1.5 sm:text-xs"
              style={{ color: "var(--text-muted)" }}
              title="Export HTML"
            >
              HTML
            </button>
          </div>
          <StatusBar status={status} />
          <Avatars awareness={awareness} />
          <button
            onClick={() => setShowShare(true)}
            className="rounded-lg bg-accent px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-accent-hover sm:px-3 sm:py-1.5 sm:text-xs"
          >
            Share
          </button>
        </div>
      </div>

      <main
        className="mt-4 flex min-h-[60vh] flex-col gap-1 rounded-2xl border p-4 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-8 lg:p-10"
        style={{
          background: "var(--bg-panel)",
          borderColor: "var(--border)",
        }}
      >
        <Toolbar doc={doc} undo={undo} onAddBlock={handleAddBlock} />
        <div className="my-5 h-px" style={{ background: "var(--border)" }} />
        {isOpeningEmptyDocument ? (
          <div className="flex flex-1 items-center justify-center py-20 text-sm" style={{ color: "var(--text-muted)" }}>
            Opening document...
          </div>
        ) : blocks.length === 0 ? (
          <WelcomeScreen doc={doc} userName={name} />
        ) : (
          <>
            {blocks.map((block, i) => (
              <div key={block.id}>
                {i > 0 && <BlockAdder onAdd={handleAddBlock} />}
                <div className="relative group">
                  <BlockHandle
                    blockId={block.id}
                    onDelete={handleDeleteBlock}
                    onDuplicate={handleDuplicateBlock}
                    onTypeChange={handleChangeType}
                  />
                  <div className="relative">
                    <RemoteCursors awareness={awareness} blockId={block.id} />
                    <EditableBlock
                      doc={doc}
                      undo={undo}
                      blockId={block.id}
                      type={block.type}
                      text={block.text.toString()}
                      index={numberedIndexById.get(block.id) ?? i + 1}
                      onChangeType={handleChangeType}
                      onCaret={handleCaret}
                    />
                  </div>
                </div>
              </div>
            ))}
            {blocks.length > 0 && <BlockAdder onAdd={handleAddBlock} />}
          </>
        )}
      </main>

      {showShare && <ShareDialog roomId={room} onClose={() => setShowShare(false)} />}
    </div>
  )
}

function RouterApp() {
  const { route } = useRouter()

  switch (route.page) {
    case "dashboard":
      return <Dashboard />
    case "editor":
      return <RoomEditor room={route.room} />
  }
}

export function App() {
  return (
    <ThemeProvider>
      <Layout>
        <RouterApp />
      </Layout>
      <ToastContainer />
    </ThemeProvider>
  )
}
