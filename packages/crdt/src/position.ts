const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const BASE = DIGITS.length

function midDigit(a: number, b: number): number {
  return Math.floor((a + b) / 2)
}

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

    result += DIGITS[lowDigit]!
    i += 1
  }
}

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
