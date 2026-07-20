import {
  getAccountAnalyticsAction,
  getAccountTimeSeriesAction,
  getAccountTopLinksAction,
  getAccountLocationsAction,
  getAccountReferrersAction,
  getAccountDevicesAction,
  getAccountStatusBreakdownAction,
} from '@/app/actions/links.analytics'
import { StatCard } from '@/components/dashboard/charts/stat-card'
import { SegmentChart } from '@/components/dashboard/charts/segment-chart'
import { LocationsTable } from '@/components/dashboard/charts/locations-table'
import { FaviconImg } from '@/components/dashboard/charts/favicon-img'
import { TimeSeriesChart } from './time-series-chart'
import { rangeFromDays } from '@/lib/analytics-helpers'
import { auth } from '@/lib/auth'
import { LockedPage } from '@/components/dashboard/locked-page'
import { getCurrentUserSubscription, isPro } from '@/lib/plan'

const SEGMENT_COLORS = ['#3D52A0', '#14b8a6', '#f97316', '#8b5cf6', '#ef4444']
const STATUS_COLORS = ['#14b8a6', '#94a3b8', '#f87171']

export default async function AnalyticsPage() {
  const session = await auth()

  if (session?.user?.role !== 'admin') {
    const subscription = await getCurrentUserSubscription()
    if (!isPro(subscription)) {
      return (
        <LockedPage
          title="Analytics are Pro only"
          description="Upgrade to LinkVault Pro to unlock advanced analytics, click trends, referrer tracking, and device breakdowns for all your links."
        />
      )
    }
  }

  const range = rangeFromDays(30)

  const [summary, timeSeries, topLinks, locations, referrers, devices, statusBreakdown] =
    await Promise.all([
      getAccountAnalyticsAction(),
      getAccountTimeSeriesAction(range),
      getAccountTopLinksAction(10),
      getAccountLocationsAction(),
      getAccountReferrersAction(),
      getAccountDevicesAction(),
      getAccountStatusBreakdownAction(),
    ])

  if (!summary.success) {
    return (
      <div className="global-content py-8 text-sm text-red-600">
        Failed to load analytics: {summary.error}
      </div>
    )
  }

  const kpi = summary.data

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
      {timeSeries.success && <TimeSeriesChart data={timeSeries.data} />}

      {/* Top performing links + Status breakdown */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Top performing links</h2>
          {!topLinks.success || topLinks.data.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No links yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topLinks.data.map((link, i) => (
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

        <div className="lg:col-span-2">
          {statusBreakdown.success && (
            <SegmentChart
              title="Link status breakdown"
              data={statusBreakdown.data}
              colors={STATUS_COLORS}
            />
          )}
        </div>
      </div>

      {/* Locations + Referrers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {locations.success && <LocationsTable title="Top countries" data={locations.data} />}
        {referrers.success && (
          <SegmentChart
            title="Top referrers"
            data={referrers.data}
            colors={SEGMENT_COLORS}
          />
        )}
      </div>

      {/* Devices + Browsers */}
      {devices.success && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SegmentChart
            title="Top devices"
            data={devices.data.devices}
            colors={SEGMENT_COLORS}
          />
          <SegmentChart
            title="Top browsers"
            data={devices.data.browsers}
            colors={SEGMENT_COLORS}
          />
        </div>
      )}
    </div>
  )
}
