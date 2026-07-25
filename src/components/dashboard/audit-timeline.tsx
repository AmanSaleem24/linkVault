'use client'

import { useState, useEffect } from 'react'
import { FileText, Plus, Pencil, Trash2, ExternalLink, ToggleRight, ToggleLeft, RefreshCw } from 'lucide-react'
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
      <div className="flex items-start sm:items-center gap-2 text-foreground">
        <span className="text-muted-foreground">Targeted to:</span> 
        <code className="bg-muted/60 border border-border/50 px-2 py-1 rounded-md text-[0.85rem] font-medium break-all">{url}</code>
      </div>
    ) : <span className="text-muted-foreground">Link created successfully.</span>
  }

  if (log.action === 'delete') {
    const url = log.previousValue?.originalUrl as string | undefined
    return url ? (
      <div className="flex items-start sm:items-center gap-2 text-foreground">
        <span className="text-muted-foreground">Previously targeted to:</span> 
        <code className="bg-muted/60 border border-border/50 px-2 py-1 rounded-md text-[0.85rem] font-medium break-all">{url}</code>
      </div>
    ) : <span className="text-muted-foreground">Link deleted.</span>
  }

  if (log.action === 'enable') {
    return <span className="text-foreground">Link was enabled and is now publicly accessible.</span>
  }

  if (log.action === 'disable') {
    return <span className="text-foreground">Link was disabled and will now return a 404 page.</span>
  }

  if (log.action === 'update') {
    const changes: React.ReactNode[] = []
    const prev = log.previousValue || {}
    const next = log.newValue || {}

    if (prev.originalUrl !== next.originalUrl && next.originalUrl) {
      changes.push(
        <div key="url" className="flex flex-col sm:flex-row sm:items-center gap-2 text-foreground">
          <span className="text-muted-foreground shrink-0">Destination updated to:</span> 
          <code className="bg-muted/60 border border-border/50 px-2 py-1 rounded-md text-[0.85rem] font-medium break-all">{next.originalUrl as string}</code>
        </div>
      )
    }
    if (prev.slug !== next.slug && next.slug) {
      changes.push(
        <div key="slug" className="flex items-center gap-2 text-foreground">
          <span className="text-muted-foreground shrink-0">Alias changed to:</span> 
          <strong className="text-foreground bg-foreground/5 px-2 py-0.5 rounded-md">/{next.slug as string}</strong>
        </div>
      )
    }
    
    if (changes.length > 0) {
      return <div className="flex flex-col gap-2">{changes}</div>
    }
    return <span className="text-muted-foreground">Link details updated.</span>
  }

  return <span className="text-muted-foreground">Action performed.</span>
}

interface AuditTimelineProps {
  initialLogs: AuditLogEntry[]
  totalCount: number
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function AuditTimeline({ initialLogs, totalCount, onRefresh, isRefreshing }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Sync internal state when fresh data is fetched via SWR
  useEffect(() => {
    setLogs(initialLogs)
  }, [initialLogs])

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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Log</h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            A comprehensive record of all actions taken on your links.
          </p>
        </div>
        {onRefresh && (
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-10 w-10 flex items-center justify-center rounded-md border border-border/60 hover:bg-muted text-muted-foreground transition-all shrink-0 disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw className={cn("size-4", isRefreshing && "animate-spin text-foreground")} />
            </button>
          </div>
        )}
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

        {logs.length > 0 && (
          <div className="space-y-0 relative">
            {logs.map((log, index) => {
              const config = ACTION_CONFIG[log.action] ?? DEFAULT_CONFIG
              const Icon = config.icon
              const { date, time } = formatDate(log.createdAt)
              
              const isLast = index === logs.length - 1

              return (
                <div key={log.id} className="relative pl-12 md:pl-48 py-5 group first:pt-2 last:pb-2">
                  
                  {/* Timeline Line Connecting Events */}
                  {!isLast && (
                    <div className="absolute top-10 bottom-[-1.25rem] left-[23px] md:left-[9.5rem] w-px bg-border/80 z-0" />
                  )}

                  {/* Node / Icon */}
                  <div className={cn("absolute left-2 md:left-[8.5rem] top-5 size-10 rounded-full flex items-center justify-center border-[3px] border-background z-10 shadow-sm ring-1 ring-border/20 transition-transform group-hover:scale-110", config.iconBg)}>
                     <Icon className={cn("size-4", config.iconColor)} strokeWidth={2.5} />
                  </div>

                  {/* Desktop Date/Time */}
                  <div className="hidden md:flex absolute left-0 top-5 w-28 flex-col items-end pt-1 pr-2">
                    <span className="text-[0.9rem] font-bold text-foreground">{date}</span>
                    <span className="text-[0.8rem] text-muted-foreground font-medium mt-0.5">{time}</span>
                  </div>

                  {/* Card */}
                  <div className="bg-card rounded-xl p-5 border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80 z-10 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-border/40">
                      
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={cn("inline-flex items-center gap-1.5 text-[0.75rem] font-bold uppercase tracking-widest", config.badgeText)}>
                          {config.label}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        {log.linkSlug ? (
                          <span className="font-bold text-foreground text-[0.95rem]">/{log.linkSlug}</span>
                        ) : (
                          <span className="font-semibold text-muted-foreground italic text-[0.95rem]">System</span>
                        )}
                      </div>

                      {/* Mobile Date/Time & Visit Link */}
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="md:hidden flex items-center gap-2 text-[0.8rem] text-muted-foreground font-medium">
                          <span>{date}</span>
                          <span className="size-1 rounded-full bg-border" />
                          <span>{time}</span>
                        </div>
                        
                        {log.linkUrl && (
                          <a 
                            href={log.linkUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[var(--accent-brand)] bg-[var(--accent-brand)]/10 px-2.5 py-1.5 rounded-md hover:bg-[var(--accent-brand)]/20 transition-colors shadow-sm"
                          >
                            Visit <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-[0.9rem] leading-relaxed">
                      <EventDetails log={log} />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Load more */}
            {hasMore && (
              <div className="relative flex items-center justify-center pt-8 pb-4 z-10">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="h-11 px-8 rounded-full bg-background border-2 border-border/60 text-[0.95rem] font-bold text-foreground hover:bg-muted hover:border-border transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                >
                  {isLoadingMore ? 'Loading...' : 'Load older activity'}
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  )
}
