import type { ConnectionStatus } from "@/sync/WebsocketProvider"

const LABEL: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  online: "Live — synced",
  offline: "Offline — changes saved locally",
}

const DOT: Record<ConnectionStatus, string> = {
  connecting: "bg-yellow-400",
  online: "bg-green-400",
  offline: "bg-red-400",
}

export function StatusBar({
  status,
  pending,
}: {
  status: ConnectionStatus
  pending: number
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-white/60">
      <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
      <span>{LABEL[status]}</span>
      {pending > 0 && (
        <span className="text-white/40">· {pending} buffered</span>
      )}
    </div>
  )
}
