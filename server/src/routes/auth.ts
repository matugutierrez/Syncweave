import { Router } from "express"
import bcrypt from "bcrypt"
import { promises as fs } from "node:fs"
import path from "node:path"
import { config } from "../config"
import { issueToken, verifyToken, colorForUser } from "../auth"
import { rateLimit, requireBody, type AuthRequest } from "../middleware"

export const authRouter = Router()

interface UserRecord {
  email: string
  password: string
  name: string
  color: string
  createdAt: string
}

const SALT_ROUNDS = 10

async function loadUsers(): Promise<Map<string, UserRecord>> {
  try {
    const raw = await fs.readFile(path.join(config.dataDir, "users.json"), "utf8")
    const arr = JSON.parse(raw) as UserRecord[]
    return new Map(arr.map((u) => [u.email, u]))
  } catch {
    return new Map()
  }
}

async function saveUsers(users: Map<string, UserRecord>): Promise<void> {
  await fs.writeFile(
    path.join(config.dataDir, "users.json"),
    JSON.stringify([...users.values()], null, 2),
    "utf8",
  )
}

authRouter.post(
  "/register",
  rateLimit(10, 60_000),
  requireBody("email", "password", "name"),
  async (req, res) => {
    try {
      const { email, password, name } = req.body
      const users = await loadUsers()
      if (users.has(email)) {
        res.status(409).json({ message: "Email already registered" })
        return
      }
      const hash = await bcrypt.hash(password, SALT_ROUNDS)
      const user: UserRecord = {
        email,
        password: hash,
        name: String(name).slice(0, 40),
        color: colorForUser(email),
        createdAt: new Date().toISOString(),
      }
      users.set(email, user)
      await saveUsers(users)
      const token = issueToken({ sub: email, name: user.name, color: user.color })
      res.status(201).json({ token, sub: email, name: user.name, color: user.color })
    } catch {
      res.status(500).json({ message: "Registration failed" })
    }
  },
)

authRouter.post(
  "/login",
  rateLimit(20, 60_000),
  requireBody("email", "password"),
  async (req, res) => {
    try {
      const { email, password } = req.body
      const users = await loadUsers()
      const user = users.get(email)
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" })
        return
      }
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        res.status(401).json({ message: "Invalid email or password" })
        return
      }
      const token = issueToken({ sub: email, name: user.name, color: user.color })
      res.json({ token, sub: email, name: user.name, color: user.color })
    } catch {
      res.status(500).json({ message: "Login failed" })
    }
  },
)

authRouter.get("/me", async (req: AuthRequest, res) => {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }
  const claims = verifyToken(header.slice(7))
  if (!claims) {
    res.status(401).json({ message: "Invalid token" })
    return
  }
  res.json(claims)
})
