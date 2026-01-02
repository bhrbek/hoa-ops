'use client'

export function VersionBadge() {
  const version = '20260101-v2'

  return (
    <div className="fixed bottom-3 right-3 z-50">
      <span className="text-[10px] font-mono text-muted-foreground/50 bg-background/80 px-2 py-1 rounded border border-border/50">
        {version}
      </span>
    </div>
  )
}
