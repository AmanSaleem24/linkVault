'use client'

type ChartTooltipProps = {
  active?: boolean
  label?: string
  payload?: Array<{ value: number; name?: string; color?: string }>
}

export function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  const dateObj = new Date(label + 'T00:00:00')
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{dateStr}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold text-foreground">
          {entry.value.toLocaleString()} {entry.name ?? 'clicks'}
        </p>
      ))}
    </div>
  )
}
