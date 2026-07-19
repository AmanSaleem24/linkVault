'use client'

import type { SegmentRow } from './types'

type SegmentChartProps = {
  title: string
  data: SegmentRow[]
  colors: string[]
}

export function SegmentChart({ title, data, colors }: SegmentChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
          <p className="text-sm font-medium">No data yet</p>
          <p className="text-xs mt-1">Clicks will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="shrink-0">
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
                const fraction = d.count / total
                const dash = fraction * circumference
                const gap = circumference - dash
                const segOffset = offset
                offset += dash
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
                    strokeDashoffset={-segOffset}
                    strokeLinecap="butt"
                  />
                )
              })}
            </svg>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {data.slice(0, 5).map((d, i) => (
              <div key={`${d.name}-${i}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="size-3 rounded-sm shrink-0"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                  <span className="text-sm font-medium text-slate-700 truncate">{d.name}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 tabular-nums ml-2 shrink-0">
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
