import { useEffect, useRef } from "react"
import type { CRDTDocument, UndoManager } from "@syncweave/crdt"
import { diffText } from "@/lib/diff"

interface EditableBlockProps {
  doc: CRDTDocument
  undo: UndoManager
  blockId: string
  text: string
  type: string
  onCaret: (blockId: string, caret: number) => void
}

/**
 * A single editable block bound to a block's text sequence in the CRDT.
 *
 * On every input we diff the DOM text against the last-known CRDT text to
 * derive the minimal change, then translate it into insert/delete operations.
 * Because the CRDT integrates concurrent remote ops independently, the block
 * re-renders from `text` (the authoritative materialized value) and we restore
 * the caret — so remote edits never clobber what the local user is typing.
 */
export function EditableBlock({
  doc,
  undo,
  blockId,
  text,
  type,
  onCaret,
}: EditableBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastText = useRef(text)

  // Keep the DOM in sync with the authoritative CRDT text without disturbing
  // the caret when the local user is the one typing.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.textContent !== text) {
      const caret = getCaret(el)
      el.textContent = text
      if (caret !== null) setCaret(el, Math.min(caret, text.length))
    }
    lastText.current = text
  }, [text])

  const handleInput = () => {
    const el = ref.current
    if (!el) return
    const next = el.textContent ?? ""
    const change = diffText(lastText.current, next)
    if (!change) return

    doc.transact(() => {
      if (change.removed.length > 0) {
        undo.trackDelete(blockId, change.index, change.removed)
        doc.deleteText(blockId, change.index, change.removed.length)
      }
      if (change.inserted.length > 0) {
        undo.trackInsert(blockId, change.index, change.inserted)
        doc.insertText(blockId, change.index, change.inserted)
      }
    })
    lastText.current = next
    onCaret(blockId, getCaret(el) ?? 0)
  }

  const isHeading = type === "heading"
  const handleCaret = () => {
    const el = ref.current
    if (el) onCaret(blockId, getCaret(el) ?? 0)
  }

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline="true"
      className={`editor-block px-1 py-0.5 leading-relaxed outline-none ${
        isHeading ? "text-2xl font-semibold" : "text-base"
      }`}
      contentEditable
      suppressContentEditableWarning
      data-block-id={blockId}
      onInput={handleInput}
      onKeyUp={handleCaret}
      onClick={handleCaret}
    />
  )
}

// ----- caret helpers ------------------------------------------------------

function getCaret(el: HTMLElement): number | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  const pre = range.cloneRange()
  pre.selectNodeContents(el)
  pre.setEnd(range.endContainer, range.endOffset)
  return pre.toString().length
}

function setCaret(el: HTMLElement, offset: number): void {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  const node = el.firstChild ?? el
  const len = el.textContent?.length ?? 0
  range.setStart(node, Math.min(offset, len))
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}
