import http from "node:http"
import express from "express"
import cors from "cors"
import { WebSocketServer, type WebSocket } from "ws"
import { decode, encode, type ClientID } from "@syncweave/crdt"
import { config } from "./config"
import { Persistence } from "./persistence"
import { RoomRegistry } from "./rooms"
import type { Room } from "./room"
import { documentRouter } from "./routes/documents"

async function main(): Promise<void> {
  const persistence = new Persistence()
  await persistence.init()
  const registry = new RoomRegistry(persistence)

  const app = express()
  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json())

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      name: "SyncWeave Server",
      health: "/health",
      documents: "/api/documents",
      websocket: "/sync",
    })
  })
  app.get("/health", (_req, res) => res.json({ ok: true }))

  // Document management routes
  app.use("/api/documents", documentRouter)

  const server = http.createServer(app)
  const wss = new WebSocketServer({ server, path: "/sync" })

  interface Session {
    socket: WebSocket
    clientID: ClientID
    name: string
    room: Room | null
    client: { socket: WebSocket; clientID: ClientID; name: string } | null
  }

  wss.on("connection", (socket: WebSocket, req) => {
    const url = new URL(req.url ?? "", "http://localhost")
    const clientID = url.searchParams.get("client") ?? `anon_${Date.now()}`
    const session: Session = {
      socket,
      clientID,
      name: "Anonymous",
      room: null,
      client: null,
    }

    socket.on("message", async (raw) => {
      let msg
      try {
        msg = decode(raw as Buffer)
      } catch {
        socket.send(encode({ t: "error", message: "bad message" }))
        return
      }

      switch (msg.t) {
        case "hello": {
          session.name = msg.name ?? "Anonymous"
          const room = await registry.get(msg.room)
          const client = {
            socket,
            clientID: session.clientID,
            name: session.name,
          }
          session.room = room
          session.client = client
          room.add(client)
          break
        }
        case "sync-request": {
          if (session.room && session.client) {
            session.room.sync(session.client, msg.vv)
          }
          break
        }
        case "ops": {
          if (session.room && session.client) {
            session.room.ingest(msg.ops, session.client)
          }
          break
        }
        case "awareness": {
          if (session.room && session.client) {
            session.room.relayAwareness(raw.toString("utf8"), session.client)
          }
          break
        }
        default:
          break
      }
    })

    socket.on("close", () => {
      if (session.room && session.client) {
        session.room.remove(session.client)
        if (session.room.isEmpty) {
          const closing = session.room
          void closing.flush().then(() => registry.drop(closing.id))
        }
      }
    })
  })

  // Periodically persist dirty rooms.
  setInterval(() => {
    for (const room of registry.all()) void room.flush()
  }, config.snapshotIntervalMs)

  server.listen(config.port, config.host, () => {
    console.log(`SyncWeave sync server running on port ${config.port}`)
  })
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
