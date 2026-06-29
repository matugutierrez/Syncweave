/**
 * Minimal text diff between the previous and next value of a contenteditable
 * block, reduced to a single (deleteAt, deleteCount, insertAt, insertText)
 * change. This is enough to translate DOM input events into CRDT operations
 * for the common typing/deletion/paste cases.
 */
export interface TextChange {
  index: number
  removed: string
  inserted: string
}

export function diffText(prev: string, next: string): TextChange | null {
  if (prev === next) return null

  let start = 0
  const minLen = Math.min(prev.length, next.length)
  while (start < minLen && prev[start] === next[start]) start++

  let endPrev = prev.length
  let endNext = next.length
  while (
    endPrev > start &&
    endNext > start &&
    prev[endPrev - 1] === next[endNext - 1]
  ) {
    endPrev--
    endNext--
  }

  return {
    index: start,
    removed: prev.slice(start, endPrev),
    inserted: next.slice(start, endNext),
  }
}
