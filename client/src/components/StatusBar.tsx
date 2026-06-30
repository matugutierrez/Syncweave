import type { ConnectionStatus } from "@/sync/WebsocketProvider"

const STATUS: Record<ConnectionStatus, { label: string; dot: string }> = {
  connecting: { label: "Connecting…", dot: "bg-yellow-400" },
  online: { label: "Synced", dot: "bg-green-400" },
  offline: { label: "Offline — saved locally", dot: "bg-red-400" },
}

export function StatusBar({ status }: { status: ConnectionStatus }) {
  const s = STATUS[status]
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <span>{s.label}</span>
    </div>
  )
}
