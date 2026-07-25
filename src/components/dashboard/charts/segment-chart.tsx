'use client'

import { useState } from 'react'
import type { SegmentRow } from './types'

type SegmentChartProps = {
  title: string
  data: SegmentRow[]
  colors: string[]
}

export function SegmentChart({ title, data, colors }: SegmentChartProps) {
  const [hoveredData, setHoveredData] = useState<{name: string, count: number, color: string} | null>(null)
  
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const size = 240
  const strokeWidth = 28
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 shrink-0 text-lg font-bold text-foreground">{title}</h3>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <p className="text-sm font-medium">No data yet</p>
          <p className="mt-1 text-xs">Clicks will appear here</p>
        </div>
      ) : (
        <div className="mt-2 flex flex-1 flex-col sm:flex-row sm:items-start sm:justify-between">
          <div className="relative flex shrink-0 items-center justify-center sm:pl-4">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-border"
                strokeWidth={strokeWidth}
              />
              {data.map((d, i) => {
                const prevOffset = data.slice(0, i).reduce((sum, dd) => sum + (dd.count / total) * circumference, 0)
                const fraction = d.count / total
                const dash = fraction * circumference
                const gap = circumference - dash
                return (
                  <circle
                    key={`${d.name}-${i}`}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors[i % colors.length]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-prevOffset}
                    strokeLinecap="butt"
                    className="transition-opacity hover:opacity-80 cursor-pointer"
                    onMouseEnter={() => setHoveredData({ name: d.name, count: d.count, color: colors[i % colors.length] })}
                    onMouseLeave={() => setHoveredData(null)}
                  />
                )
              })}
            </svg>
            
            {/* Center Content */}
            <div className="pointer-events-none absolute inset-0 sm:pl-4 flex flex-col items-center justify-center text-center">
              {hoveredData ? (
                <div className="animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{hoveredData.name}</p>
                  <p className="text-3xl font-black tabular-nums tracking-tight" style={{ color: hoveredData.color }}>
                    {hoveredData.count.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground/70 mb-0.5">Total</p>
                  <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                    {total.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 w-full max-w-[180px] space-y-2 sm:mt-0 sm:ml-auto sm:pr-4 sm:pt-4">
            {data.slice(0, 5).map((d, i) => (
              <div key={`${d.name}-${i}`} className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                  <span className="truncate text-xs font-medium text-muted-foreground">{d.name}</span>
                </div>
                <span className="ml-2 shrink-0 tabular-nums text-xs font-semibold text-foreground">
                  {d.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
