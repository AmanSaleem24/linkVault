'use client'

import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface LockedPageProps {
  title: string
  description: string
  ctaLabel?: string
  onUpgrade?: () => void
}

export function LockedPage({ 
  title, 
  description, 
  ctaLabel = 'Upgrade to Pro', 
  onUpgrade 
}: LockedPageProps) {
  const router = useRouter()
  
  const handleUpgrade = () => {
    router.push('/pricing')
  }

  return (
    <div className="relative min-h-[85vh]">
      {/* 1. BLURRED BACKDROP */}
      <div className="blur-[6px] opacity-50 pointer-events-none select-none space-y-8 pb-12">
        {/* Header */}
        <div>
          <div className="h-9 w-40 bg-slate-200 rounded-md mb-2" />
          <div className="h-5 w-64 bg-slate-100 rounded-md" />
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
              <div className="size-8 bg-slate-100 rounded-lg" />
              <div>
                <div className="w-20 h-4 bg-slate-100 rounded mb-2" />
                <div className="w-16 h-7 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Time series section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="w-32 h-6 bg-slate-200 rounded" />
            <div className="w-24 h-8 bg-slate-100 rounded-full" />
          </div>
          <div className="h-56 flex items-end gap-1.5 mt-6">
            {[40, 70, 45, 90, 65, 80, 30, 50, 85, 60, 40, 75, 55, 95, 65, 30, 45, 80, 50, 70, 85, 60, 40, 75, 90, 65, 80, 55, 45, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-cyan-500 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Two-column row: Top links & Status */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="w-48 h-6 bg-slate-200 rounded mb-8" />
            <div className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-4 h-4 bg-slate-100 rounded" />
                  <div className="size-6 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 bg-slate-200 rounded" />
                    <div className="w-48 h-3 bg-slate-100 rounded" />
                  </div>
                  <div className="w-16 h-5 bg-slate-100 rounded-full shrink-0" />
                  <div className="w-12 h-4 bg-slate-200 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center">
            <div className="w-48 h-6 bg-slate-200 rounded mb-10 self-start" />
            <div className="size-48 rounded-full border-[24px] border-slate-100" />
          </div>
        </div>

        {/* Two-column row: Locations & Referrers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
             <div key={`row2-${i}`} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
               <div className="w-32 h-6 bg-slate-200 rounded mb-8" />
               <div className="space-y-4">
                 {[...Array(5)].map((_, j) => (
                   <div key={j} className="flex items-center gap-4">
                     <div className="w-24 h-4 bg-slate-200 rounded" />
                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-slate-200" style={{ width: `${80 - j * 12}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          ))}
        </div>

        {/* Two-column row: Devices & Browsers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
             <div key={`row3-${i}`} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
               <div className="w-32 h-6 bg-slate-200 rounded mb-8" />
               <div className="space-y-4">
                 {[...Array(5)].map((_, j) => (
                   <div key={j} className="flex items-center gap-4">
                     <div className="w-24 h-4 bg-slate-200 rounded" />
                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-slate-200" style={{ width: `${75 - j * 10}%` }} />
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* 2. FRONT MODAL */}
      <div className="absolute inset-0 flex items-start justify-center pt-24 z-10">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg max-w-sm w-full text-center">
          <div className="size-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="size-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            {description}
          </p>
          <button
            onClick={handleUpgrade}
            className="w-full bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-indigo-500 transition-colors mb-4"
          >
            {ctaLabel}
          </button>
          <Link href="/home" className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors block">
            Maybe later
          </Link>
        </div>
      </div>
    </div>
  )
}
