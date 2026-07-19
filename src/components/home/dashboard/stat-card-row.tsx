'use client'

import { Lock } from 'lucide-react'
import type { DashboardStats } from '@/app/actions/dashboard'

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatCardRowProps {
  stats: DashboardStats
  isPro: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString()
}

// ─── Sub-component: a single stat card ────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  locked?: boolean
  id: string
}

function StatCard({ label, value, locked = false, id }: StatCardProps) {
  return (
    <div
      id={id}
      className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
    >
      <p className="text-[0.82rem] font-medium text-slate-500">{label}</p>

      <div className="relative mt-2 inline-block">
        {/* The value — blurred if locked */}
        <p
          className={`text-3xl font-bold tracking-tight text-slate-900 transition-all ${
            locked ? 'select-none blur-[6px]' : ''
          }`}
          aria-hidden={locked}
        >
          {/* Show a plausible-looking placeholder so blur looks natural */}
          {locked ? '9,999' : value}
        </p>

        {/* Screen-reader text when locked */}
        {locked && (
          <span className="sr-only">Upgrade to Pro to see this stat</span>
        )}
      </div>

      {/* Lock badge — top-right corner */}
      {locked && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 shadow-sm">
          <Lock className="size-3 text-slate-500" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
            Pro
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Unified 4-card layout for both free and pro users:
 *   Total links | Active links | Total clicks* | Avg. clicks per link*
 *
 * (* = locked/blurred for free users; real data never sent from server)
 *
 * "Active links" replaces the old "Links left this month" card — the quota
 * info is now surfaced directly in the quick-create card header instead.
 */
export function StatCardRow({ stats, isPro }: StatCardRowProps) {
  // Avg. clicks per link = totalClicks ÷ totalLinks (not a %, no ×100)
  const avgClicksPerLink =
    isPro && stats.totalClicks !== null && stats.totalLinks > 0
      ? (stats.totalClicks / stats.totalLinks).toFixed(1)
      : stats.totalLinks === 0
        ? '0'
        : '—'

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" id="stat-card-row">
      {/* Card 1: Total links — visible to all */}
      <StatCard
        id="stat-total-links"
        label="Total links"
        value={fmt(stats.totalLinks)}
      />

      {/* Card 2: Active links — visible to all, not analytics data */}
      <StatCard
        id="stat-active-links"
        label="Active links"
        value={fmt(stats.activeLinks)}
      />

      {/* Card 3: Total clicks — locked for free users */}
      <StatCard
        id="stat-total-clicks"
        label="Total clicks"
        value={stats.totalClicks !== null ? fmt(stats.totalClicks) : '—'}
        locked={!isPro}
      />

      {/* Card 4: Avg. clicks per link — locked for free users */}
      <StatCard
        id="stat-avg-clicks"
        label="Avg. clicks per link"
        value={avgClicksPerLink}
        locked={!isPro}
      />
    </div>
  )
}
