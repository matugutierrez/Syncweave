import { useCallback, useEffect, useRef, useState } from "react"
import type { CRDTDocument, UndoManager } from "@syncweave/crdt"
import { diffText } from "@/lib/diff"
import { SlashMenu } from "@/editor/SlashMenu"
import { FormatToolbar } from "@/editor/FormatToolbar"

interface EditableBlockProps {
  doc: CRDTDocument
  undo: UndoManager
  blockId: string
  text: string
  type: string
  index: number
  onChangeType: (blockId: string, newType: string) => void
  onCaret: (blockId: string, caret: number) => void
}

const MARKDOWN_SHORTCUTS: Array<[RegExp, string]> = [
  [/^#\s$/, "heading1"],
  [/^##\s$/, "heading2"],
  [/^###\s$/, "heading3"],
  [/^-\s$/, "bullet-list"],
  [/^1\.\s$/, "numbered-list"],
  [/^\[\]\s$/, "todo"],
  [/^>\s$/, "quote"],
]

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

export function EditableBlock({
  doc,
  undo,
  blockId,
  text,
  type,
  index,
  onChangeType,
  onCaret,
}: EditableBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastText = useRef(text)
  const [slashMenu, setSlashMenu] = useState<{ top: number; left: number } | null>(null)
  const [formatToolbar, setFormatToolbar] = useState<{ top: number; left: number } | null>(null)
  const isTypingSlash = useRef(false)

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

  const handleInput = useCallback(() => {
    const el = ref.current
    if (!el) return
    if (type === "divider") return

    const next = el.textContent ?? ""
    const change = diffText(lastText.current, next)

    if (change) {
      if (change.inserted === "/" && change.index === 0 && lastText.current === "") {
        isTypingSlash.current = true
      }

      for (const [pattern, blockType] of MARKDOWN_SHORTCUTS) {
        if (pattern.test(next)) {
          el.textContent = ""
          onChangeType(blockId, blockType)
          return
        }
      }

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
    }

    lastText.current = next

    if (next === "/" && isTypingSlash.current) {
      const rect = el.getBoundingClientRect()
      setSlashMenu({ top: rect.bottom + 4, left: rect.left })
    } else if (next !== "/") {
      isTypingSlash.current = false
    }

    onCaret(blockId, getCaret(el) ?? 0)
  }, [doc, undo, blockId, type, onChangeType, onCaret])

  const handleSelect = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !ref.current) {
      setFormatToolbar(null)
      return
    }
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    if (rect.width > 0) {
      setFormatToolbar({
        top: rect.top - 40,
        left: rect.left + rect.width / 2,
      })
    }
  }, [])

  const handleSlashSelect = useCallback(
    (blockType: string) => {
      const el = ref.current
      if (el) el.textContent = ""
      lastText.current = ""
      isTypingSlash.current = false
      setSlashMenu(null)
      onChangeType(blockId, blockType)
    },
    [blockId, onChangeType],
  )

  if (type === "divider") {
    return <hr className="my-3 border-0" style={{ borderTop: "1px solid var(--border)" }} />
  }

  if (type === "code-block") {
    return (
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        className="editor-block min-w-0 whitespace-pre-wrap break-words rounded-xl px-4 py-3 font-mono text-sm leading-relaxed outline-none [overflow-wrap:anywhere]"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
        data-block-id={blockId}
        onInput={handleInput}
        onSelect={handleSelect}
        onKeyUp={() => ref.current && onCaret(blockId, getCaret(ref.current) ?? 0)}
        onClick={() => ref.current && onCaret(blockId, getCaret(ref.current) ?? 0)}
      />
    )
  }

  const headingSize: Record<string, string> = {
    heading1: "text-3xl font-semibold tracking-[-0.04em] sm:text-4xl",
    heading2: "text-2xl font-semibold tracking-[-0.03em]",
    heading3: "text-xl font-semibold tracking-[-0.02em]",
  }

  const prefix = (() => {
    if (type === "bullet-list") return <span className="mr-2 select-none">•</span>
    if (type === "numbered-list") return <span className="mr-3 min-w-5 select-none text-right font-mono text-xs leading-7" style={{ color: "var(--text-muted)" }}>{index}.</span>
    if (type === "todo") return <span className="mr-2 select-none text-base">☐</span>
    if (type === "quote") return null
    return null
  })()

  return (
    <div className="flex min-w-0 items-start py-1">
      {prefix}
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        className={`editor-block min-w-0 flex-1 whitespace-pre-wrap break-words px-1 py-0.5 leading-7 outline-none [overflow-wrap:anywhere] ${headingSize[type] ?? "text-base"}`}
        style={{
          ...(type === "quote" ? {
            borderLeft: "3px solid var(--accent)",
            paddingLeft: "12px",
            fontStyle: "italic",
          } as React.CSSProperties : {}),
          ...(type === "todo" ? { cursor: "default" } as React.CSSProperties : {}),
        }}
        contentEditable={type !== "todo"}
        suppressContentEditableWarning
        data-block-id={blockId}
        onInput={handleInput}
        onSelect={handleSelect}
        onKeyUp={() => ref.current && onCaret(blockId, getCaret(ref.current) ?? 0)}
        onClick={() => ref.current && onCaret(blockId, getCaret(ref.current) ?? 0)}
        onMouseUp={handleSelect}
      />

      {slashMenu && (
        <SlashMenu
          top={slashMenu.top}
          left={slashMenu.left}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenu(null)}
        />
      )}

      {formatToolbar && (
        <FormatToolbar
          top={formatToolbar.top}
          left={formatToolbar.left}
          onClose={() => setFormatToolbar(null)}
        />
      )}
    </div>
  )
}
