'use client'

import type { SegmentRow } from './types'

type SegmentChartProps = {
  title: string
  data: SegmentRow[]
  colors: string[]
}

export function SegmentChart({ title, data, colors }: SegmentChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const size = 200
  const strokeWidth = 24
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 shrink-0 text-lg font-bold text-slate-900">{title}</h3>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
          <p className="text-sm font-medium">No data yet</p>
          <p className="mt-1 text-xs">Clicks will appear here</p>
        </div>
      ) : (
        <div className="mt-2 flex flex-1 flex-col sm:flex-row sm:items-start sm:justify-between">
          <div className="flex shrink-0 items-center justify-center sm:pl-4">
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
                stroke="#f1f5f9"
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
                  />
                )
              })}
            </svg>
          </div>

          <div className="mt-6 w-full max-w-[180px] space-y-2 sm:mt-0 sm:ml-auto sm:pr-4 sm:pt-4">
            {data.slice(0, 5).map((d, i) => (
              <div key={`${d.name}-${i}`} className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                  <span className="truncate text-xs font-medium text-slate-600">{d.name}</span>
                </div>
                <span className="ml-2 shrink-0 tabular-nums text-xs font-semibold text-slate-900">
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
