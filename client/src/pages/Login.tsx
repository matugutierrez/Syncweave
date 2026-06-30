import { useState } from "react"
import { useRouter } from "@/lib/router"
import { api } from "@/lib/api"
import { useToast } from "@/lib/toast"

export function Login() {
  const { navigate } = useRouter()
  const addToast = useToast((s) => s.add)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api.post<{ token: string }>("/api/auth/login", { email, password })
      localStorage.setItem("syncweave-token", res.token)
      addToast("Signed in successfully", "success")
      navigate("dashboard")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="animate-fade-in w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-muted)" }}>
          Welcome back to SyncWeave
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <button onClick={() => navigate("register")} className="underline">
            Create one
          </button>
        </p>
      </div>
    </div>
  )
}
