import { Router } from "express"
import { promises as fs } from "node:fs"
import path from "node:path"
import { config } from "../config"
import { requireAuth, requireBody, rateLimit, type AuthRequest } from "../middleware"

export const documentRouter = Router()

interface DocumentMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  ownerId: string
  ownerName: string
}

const META_PATH = path.join(config.dataDir, "documents.json")

async function loadMeta(): Promise<DocumentMeta[]> {
  try {
    const raw = await fs.readFile(META_PATH, "utf8")
    return JSON.parse(raw) as DocumentMeta[]
  } catch {
    return []
  }
}

async function saveMeta(docs: DocumentMeta[]): Promise<void> {
  await fs.writeFile(META_PATH, JSON.stringify(docs, null, 2), "utf8")
}

documentRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!
  const docs = await loadMeta()
  const filtered = docs.filter((d) => d.ownerId === user.sub)
  res.json(filtered)
})

documentRouter.post(
  "/",
  requireAuth,
  requireBody("name"),
  rateLimit(30, 60_000),
  async (req: AuthRequest, res) => {
    const user = req.user!
    const doc: DocumentMeta = {
      id: `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(req.body.name).slice(0, 100),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: user.sub,
      ownerName: user.name,
    }
    const docs = await loadMeta()
    docs.push(doc)
    await saveMeta(docs)
    res.status(201).json(doc)
  },
)

documentRouter.patch(
  "/:id",
  requireAuth,
  requireBody("name"),
  async (req: AuthRequest, res) => {
    const user = req.user!
    const docs = await loadMeta()
    const idx = docs.findIndex((d) => d.id === req.params.id && d.ownerId === user.sub)
    if (idx === -1) {
      res.status(404).json({ message: "Document not found" })
      return
    }
    docs[idx]!.name = String(req.body.name).slice(0, 100)
    docs[idx]!.updatedAt = new Date().toISOString()
    await saveMeta(docs)
    res.json(docs[idx])
  },
)

documentRouter.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!
  const docs = await loadMeta()
  const idx = docs.findIndex((d) => d.id === req.params.id && d.ownerId === user.sub)
  if (idx === -1) {
    res.status(404).json({ message: "Document not found" })
    return
  }
  docs.splice(idx, 1)
  await saveMeta(docs)
  res.json({ ok: true })
})
