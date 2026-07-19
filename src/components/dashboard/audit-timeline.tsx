'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Pencil, Trash2, ExternalLink, ToggleRight, ToggleLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditLogEntry } from '@/app/actions/links.read'

// ─── Shared action type config ───────────────────────────────────────────────

type ActionConfig = {
  label: string
  icon: typeof Plus
  badgeBg: string
  badgeText: string
  iconBg: string
  iconColor: string
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  create: {
    label: 'Created',
    icon: Plus,
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  update: {
    label: 'Edited',
    icon: Pencil,
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  delete: {
    label: 'Deleted',
    icon: Trash2,
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-600',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  enable: {
    label: 'Enabled',
    icon: ToggleRight,
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-600',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  disable: {
    label: 'Disabled',
    icon: ToggleLeft,
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
}

const DEFAULT_CONFIG: ActionConfig = ACTION_CONFIG.create

function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

function formatJsonValue(val: Record<string, unknown> | null): string {
  if (!val) return ''
  const parts: string[] = []
  if (val.slug) parts.push(`/${val.slug}`)
  if (val.originalUrl) parts.push(val.originalUrl as string)
  if (val.status) parts.push(`status: ${val.status}`)
  return parts.join(' → ') || JSON.stringify(val).slice(0, 80)
}

interface AuditTimelineProps {
  initialLogs: AuditLogEntry[]
  totalCount: number
}

export function AuditTimeline({ initialLogs, totalCount }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Group logs by date
  const grouped = logs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const { date } = formatDate(log.createdAt)
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  const hasMore = logs.length < totalCount

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    const { getAuditLogAction } = await import('@/app/actions/links.read')
    const result = await getAuditLogAction({ isPro: true, cursor: logs[logs.length - 1]?.id })
    if (result.success) {
      setLogs(prev => [...prev, ...result.data.logs])
    }
    setIsLoadingMore(false)
  }

  return (
    <div className="global-content py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">Activity log</h1>
        <p className="mt-1.5 text-base text-slate-500">
          A record of all actions taken on your links
        </p>
      </div>

      {logs.length === 0 && !isLoadingMore && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <FileText className="mx-auto size-10 text-slate-300 mb-3" />
          <p className="text-base font-medium text-slate-700">No activity yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Actions like creating, updating, or deleting links will appear here.
          </p>
        </div>
      )}

      {dates.length > 0 && (
        <div className="space-y-8">
          {dates.map((date) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {date}
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Entries for this date */}
              <div className="space-y-0">
                {grouped[date].map((log, idx) => {
                  const config = ACTION_CONFIG[log.action] ?? DEFAULT_CONFIG
                  const Icon = config.icon
                  const { time } = formatDate(log.createdAt)
                  const isLast = idx === grouped[date].length - 1
                  const isToggle = log.action === 'enable' || log.action === 'disable'

                  return (
                    <div key={log.id} className="flex gap-4">
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center">
                        <div className={cn('size-8 rounded-full flex items-center justify-center', config.iconBg)}>
                          <Icon className={cn('size-4', config.iconColor)} />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1 min-h-10" />}
                      </div>

                      {/* Content */}
                      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                              config.badgeBg,
                              config.badgeText
                            )}>
                              <Icon className="size-3" />
                              {config.label}
                            </span>
                            <span className="text-xs text-slate-400">{time}</span>
                          </div>

                          <div className="mt-3 space-y-1">
                            {log.linkSlug && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-slate-700">/{log.linkSlug}</span>
                                {log.linkUrl && (
                                  <a
                                    href={log.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-400 hover:text-brand transition-colors"
                                  >
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                )}
                              </div>
                            )}

                            {log.previousValue && (
                              <p className={cn('text-xs', isToggle ? 'text-slate-400' : 'text-slate-400')}>
                                From: {formatJsonValue(log.previousValue)}
                              </p>
                            )}
                            {log.newValue && (
                              <p className={cn('text-xs', isToggle ? 'text-slate-600 font-medium' : 'text-slate-500')}>
                                To: {formatJsonValue(log.newValue)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex items-center justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="text-[0.85rem] font-medium text-slate-500 hover:text-[#3D52A0] transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
