import { useEffect, useMemo, useRef, useState } from "react"
import {
  Awareness,
  CRDTDocument,
  UndoManager,
  generateClientID,
  type PresenceState,
} from "@syncweave/crdt"
import { IndexedDBPersistence } from "@/sync/IndexedDBPersistence"
import {
  WebsocketProvider,
  type ConnectionStatus,
} from "@/sync/WebsocketProvider"

interface UseSyncWeave {
  doc: CRDTDocument
  awareness: Awareness
  undo: UndoManager
  status: ConnectionStatus
  /** Monotonic counter bumped on every document change to trigger re-render. */
  revision: number
}

const COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#f59e0b"]

/**
 * React hook that wires up a full collaborative session for a room:
 * document + offline persistence + websocket sync + presence + undo.
 */
export function useSyncWeave(room: string, userName: string): UseSyncWeave {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")
  const [revision, setRevision] = useState(0)

  const clientID = useMemo(() => generateClientID(), [])
  const doc = useMemo(() => new CRDTDocument(clientID), [clientID])
  const undo = useMemo(() => new UndoManager(doc), [doc])

  const awareness = useMemo(() => {
    const initial: PresenceState = {
      name: userName,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      blockId: null,
      cursor: null,
      selection: null,
    }
    return new Awareness(clientID, initial)
  }, [clientID, userName])

  const providerRef = useRef<WebsocketProvider | null>(null)

  useEffect(() => {
    let disposed = false
    const persistence = new IndexedDBPersistence(room, doc)

    void persistence.init().then(() => {
      if (disposed) return
      // Seed an empty document with one paragraph if brand new.
      if (doc.childrenOf("root").length === 0) {
        doc.addBlock("paragraph")
      }
      setRevision((r) => r + 1)
    })

    const provider = new WebsocketProvider(room, doc, awareness)
    providerRef.current = provider
    const offStatus = provider.onStatus(setStatus)
    const offDoc = doc.onChange(() => setRevision((r) => r + 1))
    const offAwareness = awareness.onChange(() => setRevision((r) => r + 1))

    return () => {
      disposed = true
      offStatus()
      offDoc()
      offAwareness()
      provider.dispose()
    }
  }, [room, doc, awareness])

  return { doc, awareness, undo, status, revision }
}
