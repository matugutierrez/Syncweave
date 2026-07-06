import { useEffect, useState } from "react"
import { useRouter } from "@/lib/router"
import { api, type DocumentMeta } from "@/lib/api"
import { useToast } from "@/lib/toast"

function localDocumentId() {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function Dashboard() {
  const { navigate } = useRouter()
  const addToast = useToast((s) => s.add)
  const [docs, setDocs] = useState<DocumentMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("Untitled document")
  const [roomId, setRoomId] = useState("")
  const [creating, setCreating] = useState(false)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    api.get<DocumentMeta[]>("/api/documents")
      .then((items) => {
        setDocs(items)
        setApiError(false)
      })
      .catch(() => {
        setApiError(true)
        addToast("Server is waking up or unavailable. You can still open a document.", "info")
      })
      .finally(() => setLoading(false))
  }, [addToast])

  const handleCreate = async () => {
    const name = newName.trim() || "Untitled document"
    setCreating(true)
    try {
      const doc = await api.post<DocumentMeta>("/api/documents", { name })
      setDocs((prev) => [doc, ...prev])
      setNewName("Untitled document")
      navigate(doc.id)
    } catch {
      const id = localDocumentId()
      addToast("Opened a local document while the server is unavailable", "info")
      navigate(id)
    } finally {
      setCreating(false)
    }
  }

  const handleOpenRoom = () => {
    const clean = roomId.trim().replace(/^.*#\/?/, "")
    if (clean) navigate(clean)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          className="rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-10"
          style={{ background: "var(--bg-panel)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-xs" style={{ color: "var(--text-muted)" }}>
            Workspace
          </p>
          <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.04em] sm:mt-4 sm:text-5xl">
            Write together without account friction.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 sm:mt-4 sm:text-base sm:leading-7" style={{ color: "var(--text-muted)" }}>
            Create a document, share the URL and edit in real time. Blocks, slash commands,
            exports and presence are ready from the first click.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="min-h-10 flex-1 rounded-xl border px-3.5 text-sm outline-none transition-colors focus:border-accent sm:min-h-11 sm:px-4"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="min-h-10 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 sm:min-h-11 sm:px-6"
            >
              {creating ? "Opening..." : "New document"}
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-6"
          style={{ background: "var(--bg-panel)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-semibold sm:text-lg">Open shared document</h2>
          <p className="mt-1.5 text-xs leading-5 sm:mt-2 sm:text-sm sm:leading-6" style={{ color: "var(--text-muted)" }}>
            Paste a document id or full shared URL.
          </p>
          <div className="mt-4 flex gap-2 sm:mt-5">
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenRoom()}
              placeholder="doc_..."
              className="min-h-10 flex-1 rounded-xl border px-3 text-sm outline-none transition-colors focus:border-accent"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            />
            <button
              onClick={handleOpenRoom}
              className="rounded-xl border px-3.5 text-sm font-semibold transition-colors hover:bg-[var(--bg-hover)] sm:px-4"
              style={{ borderColor: "var(--border)" }}
            >
              Open
            </button>
          </div>
          <div className="mt-4 rounded-xl p-3 text-xs sm:mt-6 sm:rounded-2xl sm:p-4 sm:text-sm" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
            {apiError ? "Server metadata is unavailable. Direct document links still open." : "Server connected. Document list is synced."}
          </div>
        </div>
      </section>

      <section className="mt-6 sm:mt-8">
        <div className="mb-3 flex items-end justify-between gap-4 sm:mb-4">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Recent documents</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {loading ? "Loading..." : `${docs.length} saved document${docs.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border" style={{ background: "var(--bg-panel)", borderColor: "var(--border)" }} />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center" style={{ background: "var(--bg-panel)", borderColor: "var(--border)" }}>
            <p className="font-medium">No saved documents yet</p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Create one above or open a shared link.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => navigate(doc.id)}
                className="group rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "var(--bg-panel)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-base font-semibold group-hover:text-accent">{doc.name}</span>
                  <span className="rounded-full px-2 py-1 text-[11px]" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                    Open
                  </span>
                </div>
                <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
                  Updated {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
