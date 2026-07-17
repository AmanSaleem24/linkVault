'use client'

import type { LinkStats } from '@/components/home/use-create-link'

// ─── Props ────────────────────────────────────────────────────────────────────

interface UsageStatsProps {
  stats: LinkStats
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UsageStats({ stats }: UsageStatsProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[0.85rem] font-semibold text-slate-700">Monthly Usage</span>
        <span className="rounded bg-white px-2 py-1 text-[0.7rem] font-bold text-[#2B0094] shadow-sm">Free Plan</span>
      </div>
      <div className="space-y-3">
        {/* Links Progress */}
        <div>
          <div className="mb-1.5 flex justify-between text-[0.8rem] font-medium">
            <span className="text-slate-600">Links Created</span>
            <span className="text-slate-900">{stats.linkCount} / {stats.limits.links}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[#3D00D1] to-[#2B0094] transition-all"
              style={{ width: `${Math.min(100, (stats.linkCount / stats.limits.links) * 100)}%` }}
            />
          </div>
        </div>
        {/* QR Progress */}
        <div>
          <div className="mb-1.5 flex justify-between text-[0.8rem] font-medium">
            <span className="text-slate-600">QR Codes Generated</span>
            <span className="text-slate-900">{stats.qrCount} / {stats.limits.qr}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[#3D00D1] to-[#2B0094] transition-all"
              style={{ width: `${Math.min(100, (stats.qrCount / stats.limits.qr) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
