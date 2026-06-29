import jwt from "jsonwebtoken"
import { config } from "./config"

export interface UserClaims {
  sub: string
  name: string
  color: string
}

/** Issue a short-lived collaboration token. */
export function issueToken(claims: UserClaims): string {
  return jwt.sign(claims, config.jwtSecret, { expiresIn: "12h" })
}

/** Verify a token from a WebSocket handshake. Returns null when invalid. */
export function verifyToken(token: string | undefined): UserClaims | null {
  if (!token) return null
  try {
    return jwt.verify(token, config.jwtSecret) as UserClaims
  } catch {
    return null
  }
}

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
]

export function colorForUser(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]!
}
