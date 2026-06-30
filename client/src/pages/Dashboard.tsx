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
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const token = localStorage.getItem("syncweave-token")

  const fetchDocs = () => {
    if (!token) {
      setLoading(false)
      return
    }
    api.get<DocumentMeta[]>("/api/documents")
      .then(setDocs)
      .catch(() => addToast("Failed to load documents", "error"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDocs() }, [])

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

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return
    try {
      await api.patch(`/api/documents/${id}`, { name: renameValue.trim() })
      setDocs((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: renameValue.trim() } : d)),
      )
      setRenaming(null)
      addToast("Document renamed", "success")
    } catch {
      addToast("Failed to rename document", "error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this document?")) return
    try {
      await api.del(`/api/documents/${id}`)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      addToast("Document deleted", "success")
    } catch {
      addToast("Failed to delete document", "error")
    }
  }

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="animate-fade-in max-w-sm text-center">
          <div className="mb-4 text-5xl">📝</div>
          <h1 className="mb-2 text-2xl font-bold">Your Documents</h1>
          <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
            Sign in to create and manage your collaborative documents.
          </p>
          <button
            onClick={() => navigate("login")}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Sign in
          </button>
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Or{" "}
            <button onClick={() => navigate("register")} className="underline">
              create an account
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse-soft text-sm" style={{ color: "var(--text-muted)" }}>
          Loading documents…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
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
            className="flex-1 rounded-lg border px-4 py-2 text-sm"
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

        {docs.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="mb-3 text-4xl">📄</div>
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
                <div className="flex-1">
                  {renaming === doc.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(doc.id)
                        if (e.key === "Escape") setRenaming(null)
                      }}
                      onBlur={() => setRenaming(null)}
                      className="w-full rounded border bg-transparent px-2 py-1 text-base font-medium outline-none"
                      style={{ borderColor: "var(--accent)", color: "var(--text)" }}
                    />
                  ) : (
                    <button
                      onClick={() => navigate(doc.id)}
                      className="text-left text-base font-medium transition-colors hover:text-accent"
                    >
                      {doc.name}
                    </button>
                  )}
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    Created {new Date(doc.createdAt).toLocaleDateString()} · {doc.ownerName}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setRenaming(doc.id)
                      setRenameValue(doc.name)
                    }}
                    className="rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-[var(--bg)]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-[var(--bg)]"
                    style={{ color: "var(--danger)" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
