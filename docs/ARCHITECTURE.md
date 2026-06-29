# Architecture deep-dive

This document explains *why* SyncWeave is structured the way it is and how data
flows through the system.

## 1. The operation is the atom

Everything that happens to a document is expressed as an immutable
`Operation`:

- `insert` — add an item to a text sequence (with causal neighbours)
- `delete` — tombstone an item
- `set` — last-write-wins attribute assignment
- `addBlock` — create a block node in the tree

Operations are the **only** thing that travels over the network or is stored on
disk. The full document state is always derivable by replaying operations.
This is what makes the system robust: there is no mutable shared state to
corrupt, only an append-only history.

## 2. Convergence

A data type is a CRDT if concurrent operations **commute** — applying them in
any order yields the same result. SyncWeave guarantees this per type:

- **Sequence (YATA):** integration order is decided by `(originLeft,
  originRight)` plus a total order on `(client, clock)` ids. Two replicas
  given the same ops always produce the same linked list.
- **LWW map:** the write with the greatest Hybrid Logical Clock timestamp
  wins; ties break on client id.
- **Block tree:** ordering uses fractional-index keys, so concurrent inserts
  at the “same” slot get distinct keys and never collide.

## 3. Causal delivery

Networks deliver messages out of order. The `OpLog` buffers an operation until
every operation it causally depends on has been applied, then releases it (and
transitively anything waiting on it). This means a replica never observes an
insert before the item it is anchored to.

## 4. Sync protocol

```
client                         server
  | --- hello(room, token) ----->|
  | --- sync-request(vv) ------->|   vv = my version vector
  |<-- sync-response(missingOps)-|   ops I haven't seen
  | --- ops(localOps) --------->|   broadcast to peers, persisted
  |<-- ops(remoteOps) ----------|   from other clients
  | <-> awareness(presence) <--->|   ephemeral, not persisted
```

The server is deliberately “dumb”: it never resolves conflicts, it only relays
and persists. All intelligence lives in the CRDT, so the same engine runs
identically on every client.

## 5. Offline-first

The client writes every operation to IndexedDB as it is produced. On startup it
replays the local log before connecting, so the document is available instantly
with no network. The WebSocket provider queues operations generated while
offline and flushes them on reconnect; the version-vector handshake then pulls
anything that changed remotely in the meantime.
