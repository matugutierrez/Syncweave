export function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse-soft rounded"
          style={{
            width: `${60 + Math.random() * 40}%`,
            background: "var(--bg-hover)",
          }}
        />
      ))}
    </div>
  )
}
