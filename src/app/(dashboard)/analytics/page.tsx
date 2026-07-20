'use client'

import useSWR from 'swr'
import { getFullAccountAnalyticsAction } from '@/app/actions/links.analytics'
import { StatCard } from '@/components/dashboard/charts/stat-card'
import { SegmentChart } from '@/components/dashboard/charts/segment-chart'
import { LocationsTable } from '@/components/dashboard/charts/locations-table'
import { FaviconImg } from '@/components/dashboard/charts/favicon-img'
import { TimeSeriesChart } from './time-series-chart'
import { rangeFromDays } from '@/lib/analytics-helpers'
import { LockedPage } from '@/components/dashboard/locked-page'

const SEGMENT_COLORS = ['#06b6d4', '#f97316', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981']
const STATUS_COLORS = ['#10b981', '#94a3b8', '#ef4444']

export default function AnalyticsPage() {
  const range = rangeFromDays(30)
  const { data: result, isLoading } = useSWR(
    'account-analytics-full', 
    () => getFullAccountAnalyticsAction(range),
    { revalidateOnFocus: true }
  )

  if (isLoading || !result) {
    return (
      <div className="global-content py-8 space-y-8 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-md" />
          <div className="h-4 w-64 bg-slate-200 rounded-md mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-[360px] bg-slate-200 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="h-[360px] bg-slate-200 rounded-2xl lg:col-span-3" />
          <div className="h-[360px] bg-slate-200 rounded-2xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!result.success || !result.data) {
    if (result.error === 'PRO_REQUIRED') {
      return (
        <LockedPage
          title="Analytics are Pro only"
          description="Upgrade to LinkVault Pro to unlock advanced analytics, click trends, referrer tracking, and device breakdowns for all your links."
        />
      )
    }
    return (
      <div className="global-content py-8 text-sm text-red-600">
        Failed to load analytics: {result.error || 'Unknown error'}
      </div>
    )
  }

  const kpi = result.data.summary
  const { timeSeries, topLinks, locations, referrers, devices, statusBreakdown, utm } = result.data

  return (
    <div className="global-content py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Performance across all your links</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Clicks"
          value={kpi.totalClicks.toLocaleString()}
          icon="mouse-pointer-click"
        />
        <StatCard label="Total Links" value={kpi.totalLinks.toLocaleString()} icon="link" />
        <StatCard
          label="Unique Visitors"
          value={kpi.uniqueVisitors.toLocaleString()}
          icon="users"
        />
        <StatCard
          label="Top Country"
          value={kpi.topCountry?.name ?? '—'}
          icon="globe-2"
        />
        <StatCard
          label="Top Device"
          value={kpi.topDevice?.name ?? '—'}
          icon="smartphone"
        />
        <StatCard
          label="Top Referrer"
          value={kpi.topReferrer?.name ?? '—'}
          icon="bar-chart-3"
        />
      </div>

      {/* Clicks over time */}
      {timeSeries && timeSeries.length > 0 && <TimeSeriesChart data={timeSeries} />}

      {/* Top performing links + Status breakdown */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex h-[360px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h2 className="mb-4 shrink-0 text-xl font-bold text-slate-900">Top performing links</h2>
          {!topLinks || topLinks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">No links yet</div>
          ) : (
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden">
              {topLinks.map((link, i) => (
                <li key={link.id} className="flex items-center gap-3 py-3">
                  <span className="text-xs font-medium text-slate-400 w-5 shrink-0">
                    {i + 1}
                  </span>
                  <FaviconImg url={link.originalUrl} size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">/{link.slug}</p>
                    <p className="text-xs text-slate-400 truncate">{link.originalUrl}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      link.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : link.status === 'disabled'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {link.status}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums w-16 text-right shrink-0">
                    {link.clickCount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-[360px] lg:col-span-2 lg:h-auto">
          {statusBreakdown && statusBreakdown.length > 0 && (
            <SegmentChart
              title="Link status breakdown"
              data={statusBreakdown}
              colors={STATUS_COLORS}
            />
          )}
        </div>
      </div>

      {/* Locations + Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {locations && locations.length > 0 && <LocationsTable title="Top countries" data={locations} />}
        {referrers && referrers.length > 0 && (
          <SegmentChart
            title="Top referrers"
            data={referrers}
            colors={SEGMENT_COLORS}
          />
        )}
      </div>

      {/* Devices + Browsers */}
      {devices && devices.devices && devices.browsers && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SegmentChart
            title="Top devices"
            data={devices.devices}
            colors={SEGMENT_COLORS}
          />
          <SegmentChart
            title="Top browsers"
            data={devices.browsers}
            colors={SEGMENT_COLORS}
          />
        </div>
      )}

      {/* UTM Tracking */}
      {utm && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SegmentChart
            title="Top Campaigns"
            data={utm.campaigns}
            colors={SEGMENT_COLORS}
          />
          <SegmentChart
            title="Top Sources"
            data={utm.sources}
            colors={SEGMENT_COLORS}
          />
        </div>
      )}
    </div>
  )
}
