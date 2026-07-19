'use client'

import { MousePointerClick, Link2, Users, Globe2, Smartphone, BarChart3, Lock } from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  'mouse-pointer-click': MousePointerClick,
  'link': Link2,
  'users': Users,
  'globe-2': Globe2,
  'smartphone': Smartphone,
  'bar-chart-3': BarChart3,
}

type StatCardProps = {
  label: string
  value: string
  icon: string
  isPro?: boolean
  isLocked?: boolean
}

export function StatCard({ label, value, icon, isPro = true, isLocked }: StatCardProps) {
  const Icon = ICON_MAP[icon] ?? BarChart3

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 mb-3">
        <Icon className="size-5" />
        <span className="text-sm font-medium uppercase tracking-wider">{label}</span>
        {isLocked && !isPro && <Lock className="size-4 text-slate-400 ml-auto" />}
      </div>
      {isLocked && !isPro ? (
        <div className="h-10 w-24 rounded-md bg-slate-200/70 blur-[3px]" />
      ) : (
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      )}
    </div>
  )
}
