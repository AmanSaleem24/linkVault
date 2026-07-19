'use client'

import { Lock } from 'lucide-react'

export function LockedSection({
  children,
  isPro,
  onUpgradeClick,
}: {
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
      <div className={isPro ? '' : 'blur-sm pointer-events-none select-none'}>{children}</div>
    </div>
  )
}
