import type { CRDTDocument } from "./document"

type UndoAction =
  | { type: "insert"; blockId: string; index: number; text: string }
  | { type: "delete"; blockId: string; index: number; text: string }

export class UndoManager {
  private readonly undoStack: UndoAction[][] = []
  private readonly redoStack: UndoAction[][] = []
  private currentBatch: UndoAction[] = []
  private applying = false
  private readonly doc: CRDTDocument

  constructor(doc: CRDTDocument) {
    this.doc = doc
    doc.onChange(() => this.commitBatch())
  }

  trackInsert(blockId: string, index: number, text: string): void {
    this.currentBatch.push({ type: "delete", blockId, index, text })
  }

  trackDelete(blockId: string, index: number, text: string): void {
    this.currentBatch.push({ type: "insert", blockId, index, text })
  }

  undo(): void {
    if (this.undoStack.length === 0) return
    const batch = this.undoStack.pop()!
    this.redoStack.push(batch.map((a) => ({ ...a })))
    this.applying = true
    try {
      this.doc.transact(() => {
        for (const action of batch.reverse()) {
          if (action.type === "delete") {
            this.doc.deleteText(action.blockId, action.index, action.text.length)
          } else {
            this.doc.insertText(action.blockId, action.index, action.text)
          }
        }
      })
    } finally {
      this.applying = false
    }
  }

  redo(): void {
    if (this.redoStack.length === 0) return
    const batch = this.redoStack.pop()!
    this.undoStack.push(batch.map((a) => ({ ...a })))
    this.applying = true
    try {
      this.doc.transact(() => {
        for (const action of batch) {
          if (action.type === "delete") {
            this.doc.insertText(action.blockId, action.index, action.text)
          } else {
            this.doc.deleteText(action.blockId, action.index, action.text.length)
          }
        }
      })
    } finally {
      this.applying = false
    }
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  private commitBatch(): void {
    if (this.applying) {
      this.currentBatch = []
      return
    }
    if (this.currentBatch.length === 0) return
    this.undoStack.push(this.currentBatch)
    this.currentBatch = []
    this.redoStack.length = 0
  }
}
