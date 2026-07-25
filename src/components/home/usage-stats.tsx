'use client'

import type { LinkStats } from '@/components/home/use-create-link'

// ─── Props ────────────────────────────────────────────────────────────────────

interface UsageStatsProps {
  stats: LinkStats
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsageStats({ stats }: UsageStatsProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-muted/50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[0.85rem] font-semibold text-foreground">Monthly Usage</span>
        <span className="rounded bg-card px-2 py-1 text-[0.7rem] font-bold text-[var(--accent-brand)] shadow-sm">Free Plan</span>
      </div>
      <div className="space-y-3">
        {/* Links Progress */}
        <div>
          <div className="mb-1.5 flex justify-between text-[0.8rem] font-medium">
            <span className="text-muted-foreground">Links Created</span>
            <span className="text-foreground">{stats.linkCount} / {stats.limits.links}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-brand)] to-[var(--accent-brand)] transition-all"
              style={{ width: `${Math.min(100, (stats.linkCount / stats.limits.links) * 100)}%` }}
            />
          </div>
        </div>
        {/* QR Progress */}
        <div>
          <div className="mb-1.5 flex justify-between text-[0.8rem] font-medium">
            <span className="text-muted-foreground">QR Codes Generated</span>
            <span className="text-foreground">{stats.qrCount} / {stats.limits.qr}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-brand)] to-[var(--accent-brand)] transition-all"
              style={{ width: `${Math.min(100, (stats.qrCount / stats.limits.qr) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
