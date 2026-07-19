'use client'

import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'

// ─── Component ────────────────────────────────────────────────────────────────

export function UpgradeBanner() {
  return (
    <div
      id="upgrade-banner"
      className="flex items-center justify-between gap-4 rounded-2xl border border-[#2B0094]/20 bg-[#ECEEFE] px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2B0094]/10">
          <Lock className="size-4 text-[#2B0094]" />
        </div>
        <p className="text-[0.9rem] font-medium text-[#2B0094]">
          Unlock click analytics and per-link stats with Pro
        </p>
      </div>
      <Link
        href="/billing/upgrade"
        id="upgrade-banner-cta"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#23007A] bg-gradient-to-b from-[#3D00D1] to-[#2B0094] px-4 py-2 text-[0.85rem] font-semibold text-white shadow-[0_2px_5px_rgba(43,0,148,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:from-[#4300E6] hover:to-[#3100A8] whitespace-nowrap"
      >
        <Sparkles className="size-3.5" />
        Upgrade to Pro
      </Link>
    </div>
  )
}
