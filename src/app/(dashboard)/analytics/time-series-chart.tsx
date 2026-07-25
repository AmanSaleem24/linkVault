'use client'

import { useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DateFilterPopover, type DateFilter } from '@/components/home/date-filter-popover'
import { ChartTooltip } from '@/components/dashboard/charts/chart-tooltip'
import { BarChart3 } from 'lucide-react'
import { useTheme } from 'next-themes'

type TimeSeriesChartProps = {
  data: Array<{ date: string; count: number }>
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 30)
    return { preset: 'Last 30 days', from: from.toISOString(), to: to.toISOString() }
  })

  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const tickColor = isDark ? '#6b7280' : '#94a3b8'
  const axisColor = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'
  const activeBarColor = isDark ? '#7091E6' : '#06b6d4'
  const emptyBarColor = isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'

  const handleApply = useCallback((from: string, to: string, preset?: string) => {
    setDateFilter({ preset: preset ?? null, from, to })
  }, [])

  const handleClear = useCallback(() => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 30)
    setDateFilter({ preset: 'Last 30 days', from: from.toISOString(), to: to.toISOString() })
  }, [])

  const hasData = data.some((d) => d.count > 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Clicks over time</h2>
      </div>

      <div className="mb-5">
        <DateFilterPopover
          dateFrom={dateFilter.from}
          dateTo={dateFilter.to}
          activeLabel={dateFilter.preset ?? (dateFilter.from && dateFilter.to ? 'Custom' : null)}
          onApply={handleApply}
          onClear={handleClear}
        />
      </div>

      <div className="h-56 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: tickColor }}
                tickLine={false}
                axisLine={{ stroke: axisColor }}
                tickFormatter={(val: string) => {
                  const d = new Date(val + 'T00:00:00')
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: tickColor }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count > 0 ? activeBarColor : emptyBarColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="size-10 mb-2 text-muted-foreground/60" />
            <p className="text-sm font-medium">No clicks yet in this period</p>
          </div>
        )}
      </div>
    </div>
  )
}
