/**
 * Fractional indexing.
 *
 * Generates an order key strictly between two existing keys without ever
 * needing to rebalance siblings. Used to order block-level nodes (paragraphs,
 * shapes) in the document tree. Between any two keys you can always mint a new
 * one, so concurrent inserts at the "same" slot never collide — they just get
 * different fractional keys and are then tie-broken by client id.
 *
 * Implementation follows the base-62 approach popularized by Figma.
 */

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const BASE = DIGITS.length

function midDigit(a: number, b: number): number {
  return Math.floor((a + b) / 2)
}

/**
 * Returns a key `k` such that `a < k < b` in lexicographic order.
 * `a` may be "" (start sentinel) and `b` may be null (end sentinel).
 */
export function generateKeyBetween(
  a: string | null,
  b: string | null,
): string {
  const lower = a ?? ""
  const upper = b ?? ""

  if (lower !== "" && upper !== "" && lower >= upper) {
    throw new Error(`generateKeyBetween: ${lower} is not < ${upper}`)
  }

  let result = ""
  let i = 0
  for (;;) {
    const lowDigit = i < lower.length ? DIGITS.indexOf(lower[i]!) : 0
    const highDigit =
      i < upper.length ? DIGITS.indexOf(upper[i]!) : upper === "" ? BASE : 0

    if (lowDigit === highDigit) {
      result += DIGITS[lowDigit]!
      i += 1
      continue
    }

    const mid = midDigit(lowDigit, highDigit)
    if (mid !== lowDigit) {
      result += DIGITS[mid]!
      return result
    }

    // Digits are adjacent: keep the low digit and descend one level deeper.
    result += DIGITS[lowDigit]!
    i += 1
  }
}

/** Generate `n` evenly spaced keys between `a` and `b`. */
export function generateNKeysBetween(
  a: string | null,
  b: string | null,
  n: number,
): string[] {
  if (n <= 0) return []
  if (n === 1) return [generateKeyBetween(a, b)]

  const mid = generateKeyBetween(a, b)
  const half = Math.floor(n / 2)
  return [
    ...generateNKeysBetween(a, mid, half),
    mid,
    ...generateNKeysBetween(mid, b, n - half - 1),
  ]
}
