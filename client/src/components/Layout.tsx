import type { ReactNode } from "react"
import { useTheme } from "@/lib/theme"
import { useRouter } from "@/lib/router"

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme()
  const { navigate } = useRouter()

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
      >
        <button
          onClick={() => navigate("dashboard")}
          className="text-lg font-bold transition-opacity hover:opacity-80"
        >
          SyncWeave
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:bg-[var(--bg-hover)]"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
