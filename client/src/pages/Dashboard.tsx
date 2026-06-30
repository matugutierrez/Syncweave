import { useEffect, useState } from "react"
import { useRouter } from "@/lib/router"
import { api, type DocumentMeta } from "@/lib/api"
import { useToast } from "@/lib/toast"

export function Dashboard() {
  const { navigate } = useRouter()
  const addToast = useToast((s) => s.add)
  const [docs, setDocs] = useState<DocumentMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.get<DocumentMeta[]>("/api/documents")
      .then(setDocs)
      .catch(() => addToast("Failed to load documents", "error"))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const doc = await api.post<DocumentMeta>("/api/documents", { name: newName.trim() })
      setDocs((prev) => [...prev, doc])
      setNewName("")
      addToast("Document created", "success")
    } catch {
      addToast("Failed to create document", "error")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="animate-fade-in">
        <h1 className="mb-1 text-2xl font-bold">Documents</h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
          {docs.length} document{docs.length !== 1 ? "s" : ""}
        </p>

        <div className="mb-8 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="New document name…"
            className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none transition-colors focus:border-accent"
            style={{
              background: "var(--bg)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse-soft text-sm" style={{ color: "var(--text-muted)" }}>
              Loading documents…
            </div>
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="font-medium">No documents yet</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Create your first document above to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="animate-slide-up flex items-center justify-between rounded-xl border px-5 py-4 transition-colors hover:bg-[var(--bg-hover)]"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  onClick={() => navigate(doc.id)}
                  className="text-left text-base font-medium transition-colors hover:text-accent"
                >
                  {doc.name}
                </button>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
