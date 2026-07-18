'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronLeft, ArrowLeft, Globe, Copy, Pencil, Share2, Tag, Lock,
  BarChart3, Sparkles, MoreHorizontal, CornerDownRight,
  ChevronDown, Calendar,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { copyToClipboard, truncateUrl, getLinkTitle } from '@/components/link/link-helpers'
import { getUserRoleAction } from '@/app/actions/user.getRole'
import {
  getLinkDetailAction,
  getClickAnalyticsAction,
  getTimeSeriesAction,
  getLocationsAction,
  getReferrersAction,
  getDevicesAction,
  type LinkDetailData,
  type ClickAnalytics,
  type TimeSeriesPoint,
  type CountryData,
  type DateRange,
} from '@/app/actions/links.analytics'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// ─── Preset ranges (computed once on mount) ────────────────────────────────────

function makeRange(id: string, days: number, label: string): DateRange {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - days)
  from.setUTCHours(0, 0, 0, 0)
  to.setUTCHours(23, 59, 59, 999)
  return { id, from, to, label }
}

function useDateRanges() {
  const [ranges, setRanges] = useState<DateRange[]>([])

  useEffect(() => {
    setRanges([
      makeRange('7d', 7, 'Last 7 days'),
      makeRange('30d', 30, 'Last 30 days'),
      makeRange('90d', 90, 'Last 90 days'),
    ])
  }, [])

  return ranges
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationRow = { name: string; count: number; percentage: number }
type SegmentRow = { name: string; count: number; percentage: number }

const CHART_COLORS = ['#3D52A0', '#14b8a6', '#f97316', '#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f59e0b']

// ─── Favicon ──────────────────────────────────────────────────────────────────

function FaviconImg({ url }: { url: string }) {
  const [errored, setErrored] = useState(false)
  let hostname = ''
  try { hostname = new URL(url).hostname } catch { /* ignore */ }

  if (!hostname || errored) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Globe className="size-6" />
      </div>
    )
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 overflow-hidden shadow-sm">
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt={hostname}
        className="size-6 object-contain"
        onError={() => setErrored(true)}
      />
    </div>
  )
}

// ─── Locked Section Wrapper ───────────────────────────────────────────────────

function LockedSection({ children, isPro, onUpgradeClick }: {
  children: React.ReactNode
  isPro: boolean
  onUpgradeClick: () => void
}) {
  return (
    <div className={`relative ${isPro ? '' : 'overflow-hidden'}`}>
      {!isPro && (
        <div className="absolute inset-[-16px] z-10 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-[1px]">
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 transition-colors"
          >
            <Lock className="size-4" />
            Upgrade
          </button>
        </div>
      )}
      <div className={isPro ? '' : 'blur-sm pointer-events-none select-none'}>
        {children}
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, isPro, isLocked }: {
  label: string
  value: string
  icon: React.ElementType
  isPro: boolean
  isLocked?: boolean
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 mb-3">
        <Icon className="size-5" />
        <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
        {isLocked && !isPro && <Lock className="size-4 text-slate-400 ml-auto" />}
      </div>
      {isLocked && !isPro ? (
        <div className="h-10 w-24 rounded-md bg-slate-200/70 blur-[3px]" />
      ) : (
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      )}
    </div>
  )
}

// ─── Styled Date Range Dropdown ───────────────────────────────────────────────

function DateRangeDropdown({ ranges, selected, onChange, onCustom }: {
  ranges: DateRange[]
  selected: DateRange
  onChange: (r: DateRange) => void
  onCustom: () => void
}) {
  const [viewDate, setViewDate] = useState(new Date(selected.from))

  const daysInMonth = new Date(viewDate.getUTCFullYear(), viewDate.getUTCMonth() + 1, 0).getUTCDate()
  const firstDay = new Date(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), 1).getUTCDay()
  const today = new Date()
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

  const monthLabel = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const goPrev = () => {
    const d = new Date(viewDate)
    d.setUTCMonth(d.getUTCMonth() - 1)
    setViewDate(d)
  }
  const goNext = () => {
    const d = new Date(viewDate)
    d.setUTCMonth(d.getUTCMonth() + 1)
    setViewDate(d)
  }

  const selectDate = (day: number) => {
    const clicked = new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), day))

    // Find which range this date falls into
    const match = ranges.find(r => {
      const from = new Date(r.from); from.setUTCHours(0,0,0,0)
      const to = new Date(r.to); to.setUTCHours(23,59,59,999)
      return clicked >= from && clicked <= to
    })

    if (match) {
      onChange(match)
    } else {
      // Clicked outside any preset range — open custom picker
      onCustom()
    }
  }

  const isInRange = (day: number) => {
    const d = new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), day))
    const from = new Date(selected.from); from.setUTCHours(0,0,0,0)
    const to = new Date(selected.to); to.setUTCHours(23,59,59,999)
    return d >= from && d <= to
  }

  const isSelected = (day: number) => {
    const d = new Date(Date.UTC(viewDate.getUTCFullYear(), viewDate.getUTCMonth(), day))
    const from = new Date(selected.from); from.setUTCHours(0,0,0,0)
    return d.getTime() === from.getTime()
  }

  const isToday = (day: number) =>
    viewDate.getUTCMonth() === today.getUTCMonth() &&
    viewDate.getUTCFullYear() === today.getUTCFullYear() &&
    day === today.getUTCDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const dayAbbr = ['Su','Mo','Tu','We','Th','Fr','Sa']

  return (
    <DropdownMenuContent align="start" className="w-72 rounded-2xl border border-slate-200 bg-white p-0 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 z-50 overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={goPrev}
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8L10 13" />
          </svg>
        </button>
        <span className="text-sm font-bold text-slate-900 tracking-tight">{monthLabel}</span>
        <button
          type="button"
          onClick={goNext}
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3L11 8L6 13" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-4">
        {dayAbbr.map(d => (
          <div key={d} className="flex items-center justify-center py-1.5">
            <span className="text-[0.65rem] font-semibold text-slate-400">{d}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-4 pb-2">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            {day !== null && (
              <button
                type="button"
                onClick={() => selectDate(day)}
                className={`
                  flex size-8 items-center justify-center rounded-lg text-[0.8rem] font-medium
                  transition-all duration-150 cursor-pointer
                  ${isSelected(day)
                    ? 'bg-brand-400 text-white shadow-md shadow-brand-400/30'
                    : isInRange(day)
                      ? 'text-brand-400 font-semibold bg-brand-400/10'
                      : 'text-slate-600 hover:bg-slate-100 active:scale-90'
                  }
                  ${isToday(day) && !isSelected(day) ? 'ring-1 ring-brand-400/30' : ''}
                `}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick-select ranges */}
      <div className="mx-4 mb-3 flex gap-1.5">
        {ranges.map(r => (
          <button
            key={r.id}
            onClick={() => onChange(r)}
            className={`
              flex-1 rounded-lg py-2 text-center text-[0.75rem] font-semibold transition-all
              ${r.id === selected.id
                ? 'bg-brand-400 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            {r.id === '7d' ? '7d' : r.id === '30d' ? '30d' : r.id === '90d' ? '90d' : 'All'}
          </button>
        ))}
      </div>

      {/* Custom range link */}
      <button
        type="button"
        onClick={onCustom}
        className="mx-4 mb-4 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:border-brand-400 hover:text-brand-400 hover:bg-brand-400/5"
      >
        <Calendar className="size-3.5" />
        Custom date range
      </button>
    </DropdownMenuContent>
  )
}

// ─── Calendar Picker ──────────────────────────────────────────────────────────

function CalendarPicker({ value, onChange, minDate, maxDate, selecting }: {
  value: Date
  onChange: (d: Date) => void
  minDate?: Date
  maxDate?: Date
  selecting?: 'from' | 'to'
}) {
  const [viewMonth, setViewMonth] = useState(value.getUTCMonth())
  const [viewYear, setViewYear] = useState(value.getUTCFullYear())

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getUTCDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getUTCDay()
  const today = new Date()

  const isCurrentMonth = today.getUTCMonth() === viewMonth && today.getUTCFullYear() === viewYear
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const isToday = (day: number) => isCurrentMonth && day === today.getUTCDate()

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectDate = (day: number) => {
    const d = new Date(Date.UTC(viewYear, viewMonth, day))
    d.setUTCHours(0, 0, 0, 0)
    onChange(d)
  }

  const isSelected = (day: number) =>
    value.getUTCDate() === day &&
    value.getUTCMonth() === viewMonth &&
    value.getUTCFullYear() === viewYear

  const isDisabled = (day: number) => {
    const d = new Date(Date.UTC(viewYear, viewMonth, day))
    if (minDate) { const md = new Date(minDate); md.setUTCHours(0,0,0,0); if (d < md) return true }
    if (maxDate) { const md = new Date(maxDate); md.setUTCHours(0,0,0,0); if (d > md) return true }
    return false
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const dayAbbr = ['Su','Mo','Tu','We','Th','Fr','Sa']

  return (
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-900 tracking-tight">{monthLabel}</span>
        <button
          type="button"
          onClick={goNext}
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7">
        {dayAbbr.map(d => (
          <div key={d} className="flex items-center justify-center py-1.5">
            <span className="text-[0.65rem] font-semibold text-slate-400">{d}</span>
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            {day !== null && (
              <button
                type="button"
                onClick={() => !isDisabled(day) && selectDate(day)}
                disabled={isDisabled(day)}
                className={`
                  flex size-8 items-center justify-center rounded-lg text-[0.8rem] font-medium
                  transition-all duration-150 cursor-pointer
                  ${isSelected(day)
                    ? 'bg-brand-400 text-white shadow-sm shadow-brand-400/25 scale-105'
                    : isDisabled(day)
                      ? 'text-slate-300 cursor-not-allowed'
                      : isToday(day)
                        ? 'text-brand-400 font-semibold bg-brand-400/8'
                        : 'text-slate-700 hover:bg-slate-100 active:scale-95'
                  }
                `}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Custom Range Calendar Modal ──────────────────────────────────────────────

function CustomRangeModal({ onClose, onApply }: {
  onClose: () => void
  onApply: (from: Date, to: Date) => void
}) {
  const today = new Date()
  const [fromDate, setFromDate] = useState<Date>(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6)))
  const [toDate, setToDate] = useState<Date>(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())))
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const [fromView, setFromView] = useState({ m: fromDate.getUTCMonth(), y: fromDate.getUTCFullYear() })
  const [toView, setToView] = useState({ m: toDate.getUTCMonth(), y: toDate.getUTCFullYear() })

  const formatDisplay = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const handleApply = () => {
    if (fromDate > toDate) return
    onApply(fromDate, toDate)
    onClose()
  }

  const handleClear = () => {
    const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
    const f = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6))
    setFromDate(f)
    setToDate(t)
    setFromView({ m: f.getUTCMonth(), y: f.getUTCFullYear() })
    setToView({ m: t.getUTCMonth(), y: t.getUTCFullYear() })
    setSelecting('from')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-xl flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Select date range</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {formatDisplay(fromDate)} – {formatDisplay(toDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronDown className="size-5 rotate-45" />
          </button>
        </div>

        {/* Calendars */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* From calendar */}
          <div
            onClick={() => setSelecting('from')}
            className={`flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              selecting === 'from' ? 'border-brand-400 bg-brand-400/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">From</p>
            <CalendarPicker
              value={fromDate}
              onChange={(d) => { setFromDate(d); setFromView({ m: d.getUTCMonth(), y: d.getUTCFullYear() }) }}
              minDate={undefined}
              maxDate={toDate}
            />
          </div>

          {/* To calendar */}
          <div
            onClick={() => setSelecting('to')}
            className={`flex-1 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              selecting === 'to' ? 'border-brand-400 bg-brand-400/5' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">To</p>
            <CalendarPicker
              value={toDate}
              onChange={(d) => { setToDate(d); setToView({ m: d.getUTCMonth(), y: d.getUTCFullYear() }) }}
              minDate={fromDate}
              maxDate={undefined}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={handleClear}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={fromDate > toDate}
              className="h-9 rounded-xl bg-brand-400 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const dateObj = new Date(label + 'T00:00:00')
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-slate-500 mb-0.5">{dateStr}</p>
      <p className="text-sm font-bold text-slate-900">
        {payload[0]?.value} {payload[0]?.value === 1 ? 'click' : 'clicks'}
      </p>
    </div>
  )
}

// ─── Locations Table ──────────────────────────────────────────────────────────

function LocationsTable({ data }: { data: LocationRow[] }) {
  const maxCount = data[0]?.count ?? 1

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-10">#</th>
            <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Country</th>
            <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 w-24">Volume</th>
            <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 w-16">Clicks</th>
            <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 w-14">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.name} className="border-b border-slate-50 last:border-0">
              <td className="py-3 text-sm font-medium text-slate-400">{i + 1}</td>
              <td className="py-3 text-sm font-semibold text-slate-800">{row.name}</td>
              <td className="py-3 pr-4">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#8b5cf6] transition-all"
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-3 text-right text-sm font-medium text-slate-700">{row.count.toLocaleString()}</td>
              <td className="py-3 text-right text-sm font-medium text-slate-500">{row.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Segment Donut + Legend ───────────────────────────────────────────────────

function SegmentChart({ data, colors, title }: { data: SegmentRow[]; colors: string[]; title: string }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[240px] text-slate-400">
        <p className="text-sm font-medium">No data yet</p>
        <p className="text-xs mt-1">Clicks will appear here</p>
      </div>
    )
  }

  const size = 240
  const strokeWidth = 22
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  const segments = data.map((d, i) => {
    const fraction = d.count / total
    const dash = fraction * circumference
    const gap = circumference - dash
    const segment = { ...d, color: colors[i % colors.length], dash, gap, offset }
    offset += dash
    return segment
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-16">
      <div className="shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-sm font-medium text-slate-700">{d.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">{d.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LinkAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.id as string

  const dateRanges = useDateRanges()
  const [isPro, setIsPro] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [link, setLink] = useState<LinkDetailData | null>(null)
  const [analytics, setAnalytics] = useState<ClickAnalytics | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null)
  const [showCustomCalendar, setShowCustomCalendar] = useState(false)
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [referrers, setReferrers] = useState<SegmentRow[]>([])
  const [devices, setDevices] = useState<SegmentRow[]>([])

  // Check pro status
  useEffect(() => {
    getUserRoleAction().then(result => {
      if (result.isPro) setIsPro(true)
    })
  }, [])

  // Set default range once ranges are computed
  useEffect(() => {
    if (dateRanges.length > 0 && !selectedRange) {
      setSelectedRange(dateRanges.find(r => r.id === '30d') ?? dateRanges[0])
    }
  }, [dateRanges, selectedRange])

  // Load all data
  const loadAll = useCallback(async (range: DateRange) => {
    if (!range) return
    setIsLoading(true)
    try {
      const [linkRes, analyticsRes, tsRes, locRes, refRes, devRes] = await Promise.all([
        getLinkDetailAction(linkId),
        getClickAnalyticsAction(linkId),
        getTimeSeriesAction(linkId, range),
        getLocationsAction(linkId),
        getReferrersAction(linkId),
        getDevicesAction(linkId),
      ])

      if (!linkRes.success) {
        toast.error(linkRes.error)
        router.push('/link')
        return
      }
      setLink(linkRes.data)

      if (analyticsRes.success) setAnalytics(analyticsRes.data)
      if (tsRes.success) setTimeSeries(tsRes.data)
      if (locRes.success) setLocations(locRes.data)
      if (refRes.success) setReferrers(refRes.data)
      if (devRes.success) setDevices(devRes.data)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }, [linkId, router])

  useEffect(() => {
    if (selectedRange) loadAll(selectedRange)
  }, [selectedRange, loadAll])

  // Handlers
  const handleCopy = useCallback(() => {
    if (!link) return
    copyToClipboard(`${window.location.origin}/${link.slug}`, 'Short link copied!')
  }, [link])

  const handleShare = useCallback(async () => {
    if (!link) return
    const url = `${window.location.origin}/${link.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: getLinkTitle(link.originalUrl), url })
      } else {
        copyToClipboard(url, 'Link copied for sharing!')
      }
    } catch {
      // User cancelled share
    }
  }, [link])

  const handleUpgrade = useCallback(() => {
    toast.info('Upgrade flow coming soon!')
  }, [])

  const handleCustomRange = useCallback((from: Date, to: Date) => {
    const formatD = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const label = `${formatD(from)} – ${formatD(to)}`
    setSelectedRange({
      id: 'custom',
      from,
      to,
      label,
    })
  }, [])

  // Loading state
  if (isLoading || !link || !selectedRange) {
    return (
      <div className="global-content py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 rounded bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
      </div>
    )
  }

  const shortUrl = `${window.location.origin}/${link.slug}`
  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    disabled: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    expired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  }
  const statusStyle = statusColors[link.status] ?? statusColors.active

  return (
    <div className="global-content py-8">
      {/* ── Back Link ──────────────────────────────────────────────────────── */}
      <button
        onClick={() => router.push('/link')}
        className="mb-5 inline-flex items-center gap-1 text-[13px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to list
      </button>

      {/* ── Link Info Card ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm mb-8">
        <div className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <FaviconImg url={link.originalUrl} />
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-5">
                  {getLinkTitle(link.originalUrl) || link.originalUrl}
                </h1>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[18px] text-indigo-700">{shortUrl.replace(/^https?:\/\//, '')}</span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 rounded p-1.5 text-indigo-600/70 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                      title="Copy short link"
                    >
                      <Copy className="size-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[15px] text-slate-500">
                    <CornerDownRight className="size-4" />
                    <span className="truncate">{link.originalUrl}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                  <DropdownMenuItem onClick={handleCopy} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <Copy className="size-4 text-slate-500" /> Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(link.originalUrl, '_blank')} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <Globe className="size-4 text-slate-500" /> Open link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => router.push(`/link/${link.id}/edit`)}
                title="Edit"
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="size-4" />
              </button>

              <button
                onClick={handleShare}
                title="Share"
                className="inline-flex items-center gap-2 h-9 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Tag className="size-4" />
            <span>No tags</span>
          </div>
          <span className="text-sm font-medium text-slate-500">
            {new Date(link.createdAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
          </span>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Clicks"
          value={analytics?.totalClicks.toLocaleString() ?? '0'}
          icon={BarChart3}
          isPro={isPro}
        />
        <StatCard
          label="Unique Visitors"
          value={isPro ? (analytics?.uniqueVisitors.toLocaleString() ?? '0') : '—'}
          icon={Globe}
          isPro={isPro}
          isLocked
        />
        <StatCard
          label="Top Location"
          value={isPro ? (analytics?.topCountry?.name ?? '—') : '—'}
          icon={Globe}
          isPro={isPro}
          isLocked
        />
        <StatCard
          label="Top Device"
          value={isPro ? (analytics?.topDevice?.name ?? '—') : '—'}
          icon={Globe}
          isPro={isPro}
          isLocked
        />
      </div>

      {/* ── Engagements Over Time ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Engagements over time</h2>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleUpgrade}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <Sparkles className="size-3.5 text-fuchsia-500" />
              What's driving engagement?
            </button>
            {!isPro && (
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"
              >
                <Lock className="size-3.5" />
                Upgrade
              </button>
            )}
          </div>
        </div>

        <div className="mb-5">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-400/20">
              <Calendar className="size-4 text-slate-500" />
              <span>{selectedRange?.label ?? 'Select range'}</span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                ({selectedRange ? `${selectedRange.from.toLocaleDateString('en-US', {month:'short',day:'numeric'})} – ${selectedRange.to.toLocaleDateString('en-US', {month:'short',day:'numeric'})}` : ''})
              </span>
              <ChevronDown className="size-4 text-slate-400 ml-1" />
            </DropdownMenuTrigger>
            <DateRangeDropdown
              ranges={dateRanges}
              selected={selectedRange!}
              onChange={setSelectedRange}
              onCustom={() => setShowCustomCalendar(true)}
            />
          </DropdownMenu>
        </div>

        <div className="h-56 w-full">
          {timeSeries.length > 0 && timeSeries.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeries} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val + 'T00:00:00')
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {timeSeries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#06b6d4' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <BarChart3 className="size-10 mb-2 text-slate-300" />
              <p className="text-sm font-medium">No clicks yet in this period</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Custom Calendar Modal ────────────────────────────────────────── */}
      {showCustomCalendar && (
        <CustomRangeModal
          onClose={() => setShowCustomCalendar(false)}
          onApply={handleCustomRange}
        />
      )}

      {/* ── Locations ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Locations</h2>
          <div className="flex items-center gap-3">
            {!isPro && (
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"
              >
                <Lock className="size-3.5" />
                Upgrade
              </button>
            )}
            <div className="flex items-center rounded-full bg-slate-100 p-1">
              <button className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">Countries</button>
              <button className="rounded-full px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Cities</button>
            </div>
          </div>
        </div>

        <LockedSection isPro={isPro} onUpgradeClick={handleUpgrade}>
          {locations.length > 0 ? (
            <LocationsTable data={locations} />
          ) : (
            <p className="text-center text-sm text-slate-400 py-6">No location data yet</p>
          )}
        </LockedSection>
      </div>

      {/* ── Referrers + Devices ──────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Referrers</h2>
            {!isPro && (
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"
              >
                <Lock className="size-3.5" />
                Upgrade
              </button>
            )}
          </div>

          <LockedSection isPro={isPro} onUpgradeClick={handleUpgrade}>
            <SegmentChart
              data={referrers}
              colors={['#f97316', '#06b6d4', '#8b5cf6', '#e2e8f0']}
              title="Referrers"
            />
          </LockedSection>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Devices</h2>
            {!isPro && (
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"
              >
                <Lock className="size-3.5" />
                Upgrade
              </button>
            )}
          </div>

          <LockedSection isPro={isPro} onUpgradeClick={handleUpgrade}>
            <SegmentChart
              data={devices}
              colors={['#f97316', '#06b6d4', '#8b5cf6', '#e2e8f0']}
              title="Devices"
            />
          </LockedSection>
        </div>
      </div>
    </div>
  )
}
