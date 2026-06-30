import type { ReactNode } from "react"
import { useTheme } from "@/lib/theme"
import { useRouter } from "@/lib/router"
import { api, type UserInfo } from "@/lib/api"
import { useEffect, useState } from "react"

function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("syncweave-token")
    if (!token) {
      setLoading(false)
      return
    }
    api.get<UserInfo>("/api/auth/me").then(setUser).catch(() => {
      localStorage.removeItem("syncweave-token")
    }).finally(() => setLoading(false))
  }, [])

  return { user, loading, setUser }
}

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme()
  const { navigate } = useRouter()
  const { user, loading, setUser } = useUser()

  const handleLogout = () => {
    localStorage.removeItem("syncweave-token")
    setUser(null)
    navigate("dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("dashboard")}
            className="text-lg font-bold transition-opacity hover:opacity-80"
          >
            SyncWeave
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)]"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {!loading && user && (
            <>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-muted)" }}
              >
                Log out
              </button>
            </>
          )}
          {!loading && !user && (
            <button
              onClick={() => navigate("login")}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Sign in
            </button>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
