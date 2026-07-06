import type { ReactNode } from "react"
import { useTheme } from "@/lib/theme"
import { useRouter } from "@/lib/router"

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme()
  const { navigate } = useRouter()

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b px-3 py-2.5 backdrop-blur sm:px-6 sm:py-3"
        style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
      >
        <button onClick={() => navigate("dashboard")} className="flex items-center gap-2 text-left sm:gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white shadow-sm sm:h-9 sm:w-9 sm:text-sm">
            SW
          </span>
          <span>
            <span className="block text-sm font-semibold leading-tight">SyncWeave</span>
            <span className="hidden sm:block text-xs leading-tight" style={{ color: "var(--text-muted)" }}>
              Collaborative editor
            </span>
          </span>
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => navigate("dashboard")}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)] sm:px-3 sm:py-2 sm:text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Documents
          </button>
          <button
            onClick={toggle}
            className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)] sm:px-3 sm:py-2 sm:text-sm"
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
