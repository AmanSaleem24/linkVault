'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LockedPageProps {
  title: string
  description: string
}

export function LockedPage({ title, description }: LockedPageProps) {
  const handleUpgrade = () => {
    window.location.href = '/billing/upgrade'
  }

  return (
    <div className="global-content py-8">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 mb-4">
          <Lock className="size-6 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-base text-slate-500 max-w-md mb-6">{description}</p>
        <Button
          onClick={handleUpgrade}
          className="h-10 gap-2 bg-[#3D52A0] px-6 text-[0.875rem] font-semibold text-white shadow-sm hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/40 rounded-lg"
        >
          Upgrade to Pro
        </Button>
      </div>
    </div>
  )
}
