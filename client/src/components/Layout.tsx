import type { ReactNode } from "react"
import { useTheme } from "@/lib/theme"
import { useRouter } from "@/lib/router"

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme()
  const { navigate } = useRouter()

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b px-4 py-3 backdrop-blur sm:px-6"
        style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
      >
        <button onClick={() => navigate("dashboard")} className="flex items-center gap-3 text-left">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white shadow-sm">
            SW
          </span>
          <span>
            <span className="block text-sm font-semibold leading-tight">SyncWeave</span>
            <span className="block text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
              Collaborative editor
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("dashboard")}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: "var(--text-muted)" }}
          >
            Documents
          </button>
          <button
            onClick={toggle}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
