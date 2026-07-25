'use client'

import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'

// ─── Component ────────────────────────────────────────────────────────────────

export function UpgradeBanner() {
  return (
    <div
      id="upgrade-banner"
      className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--accent-brand)]/20 bg-[var(--accent-brand-subtle)] px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-brand)]/10">
          <Lock className="size-4 text-[var(--accent-brand)]" />
        </div>
        <p className="text-[0.9rem] font-medium text-[var(--accent-brand)]">
          Unlock click analytics and per-link stats with Pro
        </p>
      </div>
      <Link
        href="/pricing"
        id="upgrade-banner-cta"
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--accent-brand-hover)] bg-gradient-to-b from-[var(--accent-brand)] to-[var(--accent-brand)] px-4 py-2 text-[0.85rem] font-semibold text-white shadow-[0_2px_5px_rgba(43,0,148,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:from-[var(--accent-brand-active)] hover:to-[var(--accent-brand)] whitespace-nowrap"
      >
        <Sparkles className="size-3.5" />
        Upgrade to Pro
      </Link>
    </div>
  )
}
