'use client'

import { useState } from 'react'
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

function EventDetails({ log }: { log: AuditLogEntry }) {
  if (log.action === 'create') {
    const url = log.newValue?.originalUrl as string | undefined
    return url ? (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground flex-wrap">
        Targeted to <code className="bg-muted/50 border border-border/50 px-1.5 py-0.5 rounded text-[0.8rem] truncate max-w-[200px] sm:max-w-sm text-foreground">{url}</code>
      </span>
    ) : <span className="text-muted-foreground">Link created</span>
  }

  if (log.action === 'delete') {
    const url = log.previousValue?.originalUrl as string | undefined
    return url ? (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground flex-wrap">
        Previously targeted to <code className="bg-muted/50 border border-border/50 px-1.5 py-0.5 rounded text-[0.8rem] truncate max-w-[200px] sm:max-w-sm text-foreground">{url}</code>
      </span>
    ) : <span className="text-muted-foreground">Link deleted</span>
  }

  if (log.action === 'enable') {
    return <span className="text-muted-foreground">Link was enabled and is now publicly accessible.</span>
  }

  if (log.action === 'disable') {
    return <span className="text-muted-foreground">Link was disabled and will now return a 404.</span>
  }

  if (log.action === 'update') {
    const changes: React.ReactNode[] = []
    const prev = log.previousValue || {}
    const next = log.newValue || {}

    if (prev.originalUrl !== next.originalUrl && next.originalUrl) {
      changes.push(
        <span key="url" className="inline-flex items-center gap-1.5 text-muted-foreground flex-wrap">
          Destination updated to <code className="bg-muted/50 border border-border/50 px-1.5 py-0.5 rounded text-[0.8rem] truncate max-w-[200px] sm:max-w-sm text-foreground">{next.originalUrl as string}</code>
        </span>
      )
    }
    if (prev.slug !== next.slug && next.slug) {
      changes.push(
        <span key="slug" className="inline-flex items-center gap-1.5 text-muted-foreground flex-wrap">
          Alias changed to <strong className="text-foreground">/{next.slug as string}</strong>
        </span>
      )
    }
    
    if (changes.length > 0) {
      return <div className="flex flex-col gap-1.5">{changes}</div>
    }
    return <span className="text-muted-foreground">Link details updated</span>
  }

  return <span className="text-muted-foreground">Action performed</span>
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
    <div className="global-content mb-12 mt-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Activity Log</h1>
          <p className="mt-3 text-[1.05rem] text-muted-foreground">
            A comprehensive record of all actions taken on your links.
          </p>
        </div>

        {logs.length === 0 && !isLoadingMore && (
          <div className="rounded-2xl border border-border/80 bg-card p-16 text-center shadow-sm">
            <FileText className="mx-auto size-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-bold text-foreground">No activity yet</p>
            <p className="mt-2 text-[0.95rem] text-muted-foreground max-w-md mx-auto">
              Once you start creating, editing, and managing your links, those actions will automatically appear here.
            </p>
          </div>
        )}

        {dates.length > 0 && (
          <div className="space-y-12">
            {dates.map((date) => (
              <div key={date}>
                {/* Date header */}
                <h2 className="text-[0.85rem] font-bold uppercase tracking-widest text-muted-foreground mb-4 pl-2">
                  {date}
                </h2>

                {/* Entries for this date */}
                <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                  <div className="divide-y divide-border/50">
                    {grouped[date].map((log) => {
                      const config = ACTION_CONFIG[log.action] ?? DEFAULT_CONFIG
                      const Icon = config.icon
                      const { time } = formatDate(log.createdAt)

                      return (
                        <div key={log.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 hover:bg-muted/20 transition-colors">
                          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                            <div className={cn('size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 border border-border/40 shadow-sm', config.iconBg)}>
                              <Icon className={cn('size-5', config.iconColor)} />
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn('text-xs font-bold uppercase tracking-wider', config.badgeText)}>
                                  {config.label}
                                </span>
                                {log.linkSlug && (
                                  <>
                                    <span className="text-muted-foreground/30">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-foreground">/{log.linkSlug}</span>
                                      {log.linkUrl && (
                                        <a
                                          href={log.linkUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-muted-foreground hover:text-[var(--accent-brand)] transition-colors inline-flex mt-0.5"
                                          title="Visit Link"
                                        >
                                          <ExternalLink className="size-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="text-[0.95rem]">
                                <EventDetails log={log} />
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-left sm:text-right shrink-0 mt-3 sm:mt-0 pl-15 sm:pl-0">
                            <span className="text-[0.85rem] font-medium text-muted-foreground">{time}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="h-11 px-6 rounded-xl bg-muted/50 border border-border/50 text-[0.95rem] font-semibold text-foreground hover:bg-muted hover:border-border transition-all disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading...' : 'Load older activity'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
