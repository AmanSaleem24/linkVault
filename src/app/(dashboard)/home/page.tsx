import { getDashboardDataAction } from '@/app/actions/dashboard'
import { QuickCreateCard } from '@/components/home/dashboard/quick-create-card'
import { StatCardRow } from '@/components/home/dashboard/stat-card-row'
import { UpgradeBanner } from '@/components/home/dashboard/upgrade-banner'
import { RecentLinksSection } from '@/components/home/dashboard/recent-links-section'

/**
 * /home — Dashboard overview page.
 *
 * This is a server component: it fetches all data in one server round-trip and
 * passes it down to client sub-components. Analytics data for free users is
 * withheld at the server level (never included in the response).
 */
export default async function HomePage() {
  const result = await getDashboardDataAction()

  // Graceful fallback on error
  if (!result.success) {
    return (
      <div className="global-content py-12">
        <p className="text-slate-500">Failed to load dashboard. Please refresh.</p>
      </div>
    )
  }

  const { firstName, stats, recentLinks, isPro } = result.data

  // Determine quota state for free users
  const linksRemainingThisMonth = stats.linksRemainingThisMonth
  const qrCodesRemainingThisMonth = stats.qrCodesRemainingThisMonth
  const isLinkLimitReached =
    !isPro && linksRemainingThisMonth !== null && linksRemainingThisMonth <= 0
  const isQrLimitReached =
    !isPro && qrCodesRemainingThisMonth !== null && qrCodesRemainingThisMonth <= 0

  return (
    <div className="global-content py-8">
      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1.5 text-base text-slate-500">
          Here&apos;s what&apos;s happening with your links.
        </p>
      </div>

      {/* ── 2. Quick-create card ────────────────────────────────────────────── */}
      <div className="mb-6">
        <QuickCreateCard
          isLinkLimitReached={isLinkLimitReached}
          isQrLimitReached={isQrLimitReached}
          linksRemainingThisMonth={isPro ? null : linksRemainingThisMonth}
          qrCodesRemainingThisMonth={isPro ? null : qrCodesRemainingThisMonth}
        />
      </div>

      {/* ── 3. Stat cards ───────────────────────────────────────────────────── */}
      <div className="mb-4">
        <StatCardRow stats={stats} isPro={isPro} />
      </div>

      {/* ── 4. Upgrade banner (free users only) ─────────────────────────────── */}
      {!isPro && (
        <div className="mb-8">
          <UpgradeBanner />
        </div>
      )}

      {/* Add spacing after stat cards when pro (no banner) */}
      {isPro && <div className="mb-8" />}

      {/* ── 5. Recent links ─────────────────────────────────────────────────── */}
      <RecentLinksSection links={recentLinks} isPro={isPro} />
    </div>
  )
}
