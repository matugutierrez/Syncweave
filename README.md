# SyncWeave

> A real-time collaborative editor powered by a **from-scratch CRDT engine**.
> No Yjs, no Automerge, no ShareDB — the conflict-resolution core is written
> by hand, from the algorithm up.

SyncWeave is a monorepo that demonstrates the three hardest problems in modern
web engineering working together:

1. **Distributed systems** — a Conflict-free Replicated Data Type (CRDT) that
   merges concurrent edits from any number of clients with **no central
   coordinator** and **guaranteed convergence**.
2. **Real-time networking** — a WebSocket sync server with per-document rooms,
   version-vector catch-up, presence relay, and reconnection.
3. **Offline-first** — every operation is persisted locally in IndexedDB, so
   the app works with no network and reconciles automatically on reconnect.

---

## Why this is hard

When two people type at the *same position at the same time*, there is no
"correct" answer the server can pick — both edits are valid and must be merged
so that **every replica ends up identical**. SyncWeave solves this with a
**YATA sequence CRDT** (the same family of algorithm as Yjs):

- Each character is an immutable item with a globally-unique dotted id
  `(client, clock)` and references to its causal left/right neighbours.
- Concurrent inserts that share neighbours are ordered deterministically using
  a total order on ids — so all replicas converge without transformation.
- Deletes are **tombstones**, never destructive, so late-arriving operations
  that reference deleted items still integrate correctly.
- A **causal op log** buffers out-of-order network delivery until each
  operation's dependencies have been applied.
- Block attributes use a **Last-Write-Wins map** keyed by **Hybrid Logical
  Clock** timestamps.

---

## Monorepo layout

```
syncweave/
├─ packages/
│  └─ crdt/                 # The engine (framework-agnostic, fully typed)
│     └─ src/
│        ├─ id.ts            # dotted ids + total order
│        ├─ clock.ts         # version vector + hybrid logical clock
│        ├─ position.ts      # fractional indexing for block order
│        ├─ operations.ts    # the immutable op format
│        ├─ sequence.ts      # YATA sequence CRDT (the hard part)
│        ├─ lww-map.ts       # last-write-wins attribute map
│        ├─ oplog.ts         # causal-delivery buffer
│        ├─ document.ts      # tree of blocks tying it together
│        ├─ awareness.ts     # ephemeral presence / cursors
│        ├─ undo.ts          # selective collaborative undo
│        └─ encoding.ts      # wire protocol
├─ server/                  # WebSocket sync + persistence (Node + ws + express)
│  └─ src/
│     ├─ index.ts          # http + ws bootstrap
│     ├─ room.ts           # per-document relay
│     ├─ rooms.ts          # room registry
│     ├─ persistence.ts    # append-only op log on disk
│     ├─ auth.ts           # JWT collaboration tokens
│     └─ config.ts
└─ client/                  # React + Vite + Tailwind editor
   └─ src/
      ├─ sync/             # websocket provider + IndexedDB persistence + hook
      ├─ editor/           # contenteditable blocks bound to the CRDT
      ├─ presence/         # remote cursors + avatars
      ├─ components/       # toolbar + status bar
      └─ App.tsx
```

---

## Getting started

```bash
# 1. Install (npm workspaces — installs all three packages)
npm install

# 2. Run server + client together
npm run dev

# 3. Open the client (Vite prints the URL, usually http://localhost:5173)
#    Open it in TWO browser tabs and watch edits merge in real time.
```

To test offline-first: open the editor, stop the server, keep typing (status
shows “Offline — changes saved locally”), then restart the server — your
edits sync automatically.

```bash
# Run the CRDT convergence tests
npm run test
```

---

## Deployment (Render)

`render.yaml` defines two services:

- **syncweave-server** — Node web service with a 1 GB persistent disk for the
  operation logs.
- **syncweave-client** — static site built from `client/dist`.

Set `VITE_WS_URL` / `VITE_API_URL` on the client and `CORS_ORIGIN` on the
server to each other's public URLs.

---

## Tech stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| CRDT engine  | TypeScript (zero runtime dependencies)                |
| Server       | Node.js, ws, Express, JSON Web Tokens                 |
| Client       | React 18, Vite, Tailwind CSS, Zustand                 |
| Persistence  | IndexedDB (client) + append-only NDJSON log (server)  |
| Transport    | WebSockets with version-vector sync + reconnection    |

---

Built by Matias Gutiérrez.
