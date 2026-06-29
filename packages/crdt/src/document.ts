import type { ClientID, ID } from "./id"
import { generateClientID } from "./id"
import { VersionVector } from "./clock"
import {
  type Operation,
  type InsertOp,
  type DeleteOp,
  type AddBlockOp,
} from "./operations"
import { SequenceCRDT } from "./sequence"
import { LWWMap } from "./lww-map"
import { OpLog } from "./oplog"
import { generateKeyBetween } from "./position"

interface BlockData {
  type: string
  text: SequenceCRDT
  attrs: LWWMap
  order: string
  parent: string
}

export interface BlockInfo {
  id: string
  type: string
  text: SequenceCRDT
}

function generateBlockID(): string {
  const rnd = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `b_${time}-${rnd}`
}

export class CRDTDocument {
  readonly clientID: ClientID
  readonly version: VersionVector
  private clock = 0
  private readonly blocks = new Map<string, BlockData>()
  private readonly opLog: OpLog
  private readonly listeners = new Set<(ops: Operation[]) => void>()
  private batch: Operation[] | null = null

  constructor(clientID?: ClientID) {
    this.clientID = clientID ?? generateClientID()
    this.version = new VersionVector()
    this.opLog = new OpLog((op) => this.applyOp(op))
  }

  get pendingOps(): number {
    return this.opLog.pendingCount
  }

  private nextID(): ID {
    this.clock += 1
    return { client: this.clientID, clock: this.clock }
  }

  onChange(fn: (ops: Operation[]) => void): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(ops: Operation[]): void {
    if (this.batch !== null) {
      this.batch.push(...ops)
      return
    }
    for (const fn of this.listeners) fn(ops)
  }

  transact(fn: () => void): void {
    this.batch = []
    try {
      fn()
    } finally {
      const ops = this.batch
      this.batch = null
      if (ops && ops.length > 0) {
        for (const fn of this.listeners) fn(ops)
      }
    }
  }

  applyRemote(ops: Operation[]): void {
    for (const op of ops) {
      this.opLog.receive(op)
    }
  }

  private applyOp(op: Operation): void {
    this.version.observe(op.id.client, op.id.clock)
    switch (op.type) {
      case "addBlock":
        this.blocks.set(op.blockId, {
          type: op.blockType,
          text: new SequenceCRDT(),
          attrs: new LWWMap(),
          order: op.order,
          parent: op.parent,
        })
        break
      case "insert": {
        const block = this.blocks.get(op.target)
        if (block) block.text.integrateInsert(op)
        break
      }
      case "delete": {
        const block = this.blocks.get(op.target)
        if (block) block.text.integrateDelete(op)
        break
      }
      case "set": {
        const block = this.blocks.get(op.target)
        if (block) block.attrs.apply(op)
        break
      }
    }
    this.emit([op])
  }

  childrenOf(parentId: string): BlockInfo[] {
    const entries: Array<BlockInfo & { order: string }> = []
    for (const [id, block] of this.blocks) {
      if (block.parent === parentId) {
        entries.push({ id, type: block.type, text: block.text, order: block.order })
      }
    }
    entries.sort((a, b) => a.order.localeCompare(b.order))
    return entries.map(({ id, type, text }) => ({ id, type, text }))
  }

  addBlock(blockType: string, parent = "root"): string {
    const blockId = generateBlockID()
    const siblings: Array<{ id: string; order: string }> = []
    for (const [id, block] of this.blocks) {
      if (block.parent === parent) {
        siblings.push({ id, order: block.order })
      }
    }
    siblings.sort((a, b) => a.order.localeCompare(b.order))
    const lastOrder = siblings.length > 0 ? siblings[siblings.length - 1]!.order : null
    const order = generateKeyBetween(lastOrder, null)
    const op: AddBlockOp = {
      type: "addBlock",
      id: this.nextID(),
      blockId,
      blockType,
      parent,
      order,
    }
    this.opLog.receive(op)
    return blockId
  }

  insertText(blockId: string, index: number, text: string): void {
    const block = this.blocks.get(blockId)
    if (!block) return
    for (let i = 0; i < text.length; i++) {
      const origins = block.text.originsForIndex(index + i)
      const op: InsertOp = {
        type: "insert",
        id: this.nextID(),
        originLeft: origins.left,
        originRight: origins.right,
        target: blockId,
        content: text[i]!,
      }
      this.opLog.receive(op)
    }
  }

  deleteText(blockId: string, index: number, length: number): void {
    const block = this.blocks.get(blockId)
    if (!block) return
    for (let i = 0; i < length; i++) {
      const id = block.text.visibleIdAt(index)
      if (!id) break
      const op: DeleteOp = {
        type: "delete",
        id: this.nextID(),
        target: blockId,
        ref: id,
      }
      this.opLog.receive(op)
    }
  }
}
