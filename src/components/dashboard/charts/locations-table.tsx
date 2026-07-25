'use client'

import type { LocationRow } from './types'

type LocationsTableProps = {
  title: string
  data: LocationRow[]
  emptyLabel?: string
  action?: React.ReactNode
}

export function LocationsTable({ title, data, emptyLabel = 'No data yet', action }: LocationsTableProps) {
  const maxCount = data[0]?.count ?? 1

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action && <div>{action}</div>}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-8">#</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Volume</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">Clicks</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">%</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 8).map((row, i) => (
                <tr key={row.name} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 text-sm font-medium text-muted-foreground">{i + 1}</td>
                  <td className="py-3 text-sm font-semibold text-foreground">{row.name}</td>
                  <td className="py-3 pr-4">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent-brand-muted)] transition-all"
                        style={{ width: `${(row.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-foreground tabular-nums">
                    {row.count.toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-muted-foreground tabular-nums">
                    {row.percentage.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
