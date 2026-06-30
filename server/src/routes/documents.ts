import { Router } from "express"
import { promises as fs } from "node:fs"
import path from "node:path"
import { config } from "../config"
import { requireBody, rateLimit } from "../middleware"

export const documentRouter = Router()

interface DocumentMeta {
  id: string
  name: string
  createdAt: string
  updatedAt: string
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

documentRouter.get("/", async (_req, res) => {
  const docs = await loadMeta()
  res.json(docs)
})

documentRouter.post(
  "/",
  requireBody("name"),
  rateLimit(30, 60_000),
  async (req, res) => {
    const doc: DocumentMeta = {
      id: `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(req.body.name).slice(0, 100),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const docs = await loadMeta()
    docs.push(doc)
    await saveMeta(docs)
    res.status(201).json(doc)
  },
)

documentRouter.patch(
  "/:id",
  requireBody("name"),
  async (req, res) => {
    const docs = await loadMeta()
    const idx = docs.findIndex((d) => d.id === req.params.id)
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

documentRouter.delete("/:id", async (req, res) => {
  const docs = await loadMeta()
  const idx = docs.findIndex((d) => d.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ message: "Document not found" })
    return
  }
  docs.splice(idx, 1)
  await saveMeta(docs)
  res.json({ ok: true })
})
