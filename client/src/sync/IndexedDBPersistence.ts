import type { CRDTDocument, Operation } from "@syncweave/crdt"

/**
 * Offline-first local persistence.
 *
 * Every operation the document produces or receives is appended to an
 * IndexedDB object store keyed by room. On startup we replay the local log so
 * the user sees their document instantly — even with no network — and any
 * edits made while offline are preserved and later flushed to the server by
 * the WebSocket provider.
 */
export class IndexedDBPersistence {
  private db: IDBDatabase | null = null
  private readonly storeName = "operations"

  constructor(
    private readonly room: string,
    private readonly doc: CRDTDocument,
  ) {}

  async init(): Promise<void> {
    this.db = await this.open()
    const ops = await this.loadAll()
    if (ops.length > 0) this.doc.applyRemote(ops)

    // Persist everything the document emits from now on.
    this.doc.onChange((newOps) => {
      void this.append(newOps)
    })
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(`syncweave:${this.room}`, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { autoIncrement: true })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }

  private append(ops: Operation[]): Promise<void> {
    if (!this.db || ops.length === 0) return Promise.resolve()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readwrite")
      const store = tx.objectStore(this.storeName)
      for (const op of ops) store.add(op)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  private loadAll(): Promise<Operation[]> {
    if (!this.db) return Promise.resolve([])
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, "readonly")
      const store = tx.objectStore(this.storeName)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result as Operation[])
      req.onerror = () => reject(req.error)
    })
  }
}
