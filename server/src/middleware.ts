import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "./auth"

const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(maxRequests = 60, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? "unknown"
    const now = Date.now()
    let entry = requestCounts.get(key)
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      requestCounts.set(key, entry)
    }
    entry.count += 1
    if (entry.count > maxRequests) {
      res.status(429).json({ message: "Too many requests" })
      return
    }
    next()
  }
}

export interface AuthRequest extends Request {
  user?: { sub: string; name: string; color: string }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing authorization token" })
    return
  }
  const token = header.slice(7)
  const claims = verifyToken(token)
  if (!claims) {
    res.status(401).json({ message: "Invalid or expired token" })
    return
  }
  req.user = claims
  next()
}

export function requireBody(...fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of fields) {
      if (req.body[field] == null || String(req.body[field]).trim() === "") {
        res.status(400).json({ message: `Missing required field: ${field}` })
        return
      }
    }
    next()
  }
}
