'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronLeft, Globe, Copy, Pencil, Share2, Tag, Lock,
  BarChart3, Sparkles, MoreHorizontal, CornerDownRight,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { copyToClipboard, getLinkTitle } from '@/components/link/link-helpers'
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
import { ShareDialog } from '@/components/dashboard/share-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { DateFilterPopover, type DateFilter } from '@/components/home/date-filter-popover'
import { StatCard } from '@/components/dashboard/charts/stat-card'
import { SegmentChart } from '@/components/dashboard/charts/segment-chart'
import { LocationsTable } from '@/components/dashboard/charts/locations-table'
import { LockedSection } from '@/components/dashboard/charts/locked-section'
import { ChartTooltip } from '@/components/dashboard/charts/chart-tooltip'
import { FaviconImg } from '@/components/dashboard/charts/favicon-img'

// ─── Types ────────────────────────────────────────────────────────────────────

type LocationRow = { name: string; count: number; percentage: number }
type SegmentRow = { name: string; count: number; percentage: number }

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LinkAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.id as string

  const [dateFilter, setDateFilter] = useState<DateFilter>(() => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 30)
    return { preset: 'Last 30 days', from: from.toISOString(), to: to.toISOString() }
  })
  const [isPro, setIsPro] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [link, setLink] = useState<LinkDetailData | null>(null)
  const [analytics, setAnalytics] = useState<ClickAnalytics | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([])
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [referrers, setReferrers] = useState<SegmentRow[]>([])
  const [devices, setDevices] = useState<SegmentRow[]>([])

  // Check pro status
  useEffect(() => {
    getUserRoleAction().then(result => {
      if (result.isPro) setIsPro(true)
    })
  }, [])

  // Load all data
  const loadAll = useCallback(async (filter: DateFilter) => {
    if (!filter.from || !filter.to) return
    setIsLoading(true)
    try {
      const range: DateRange = {
        from: new Date(filter.from),
        to: new Date(filter.to),
      }
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
    if (dateFilter.from && dateFilter.to) loadAll(dateFilter)
  }, [dateFilter, loadAll])

  // Handlers
  const handleCopy = useCallback(() => {
    if (!link) return
    copyToClipboard(`${window.location.origin}/${link.slug}`, 'Short link copied!')
  }, [link])

  const handleUpgrade = useCallback(() => {
    toast.info('Upgrade flow coming soon!')
  }, [])

  // Loading state
  if (isLoading || !link) {
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

              <ShareDialog
                url={typeof window !== 'undefined' ? `${window.location.origin}/${link.slug}` : ''}
                title={getLinkTitle(link.originalUrl)}
              >
                <button
                  title="Share"
                  className="inline-flex items-center gap-2 h-9 rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                >
                  <Share2 className="size-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </ShareDialog>
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
          icon="bar-chart-3"
          isPro={isPro}
        />
        <StatCard
          label="Unique Visitors"
          value={isPro ? (analytics?.uniqueVisitors.toLocaleString() ?? '0') : '—'}
          icon="globe-2"
          isPro={isPro}
          isLocked
        />
        <StatCard
          label="Top Location"
          value={isPro ? (analytics?.topCountry?.name ?? '—') : '—'}
          icon="globe-2"
          isPro={isPro}
          isLocked
        />
        <StatCard
          label="Top Device"
          value={isPro ? (analytics?.topDevice?.name ?? '—') : '—'}
          icon="globe-2"
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
          <DateFilterPopover
            dateFrom={dateFilter.from}
            dateTo={dateFilter.to}
            activeLabel={dateFilter.preset ?? (dateFilter.from && dateFilter.to ? 'Custom' : null)}
            onApply={(from, to, preset) => {
              setDateFilter({ preset: preset ?? null, from, to })
            }}
            onClear={() => {
              const to = new Date()
              const from = new Date(to)
              from.setDate(from.getDate() - 30)
              setDateFilter({ preset: 'Last 30 days', from: from.toISOString(), to: to.toISOString() })
            }}
          />
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
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
            <LocationsTable title="Locations" data={locations} />
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
