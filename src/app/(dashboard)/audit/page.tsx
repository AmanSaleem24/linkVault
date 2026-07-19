'use client'

import { useEffect, useState } from 'react'
import { FileText, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { getAuditLogAction, type AuditLogEntry } from '@/app/actions/links.read'
import { cn } from '@/lib/utils'

const ACTION_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  create: { icon: Plus, label: 'Created', color: 'text-emerald-600 bg-emerald-50' },
  update: { icon: Pencil, label: 'Updated', color: 'text-blue-600 bg-blue-50' },
  delete: { icon: Trash2, label: 'Deleted', color: 'text-red-600 bg-red-50' },
}

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

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAuditLogAction().then((result) => {
      if (!result.success) {
        setError(result.error)
      } else {
        setLogs(result.data.logs)
      }
      setIsLoading(false)
    })
  }, [])

  // Group logs by date
  const grouped = logs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const { date } = formatDate(log.createdAt)
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  return (
    <div className="global-content py-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">Activity log</h1>
        <p className="mt-1.5 text-base text-slate-500">
          A record of all actions taken on your links
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="flex flex-col items-center">
                <div className="size-8 rounded-full bg-slate-200" />
                <div className="w-px h-12 bg-slate-200 mt-2" />
              </div>
              <div className="flex-1 space-y-2 pb-6">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-3 w-64 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!isLoading && !error && logs.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <FileText className="mx-auto size-10 text-slate-300 mb-3" />
          <p className="text-base font-medium text-slate-700">No activity yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Actions like creating, updating, or deleting links will appear here.
          </p>
        </div>
      )}

      {!isLoading && !error && dates.length > 0 && (
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
                  const config = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.create
                  const Icon = config.icon
                  const { time } = formatDate(log.createdAt)
                  const isLast = idx === grouped[date].length - 1

                  return (
                    <div key={log.id} className="flex gap-4">
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'size-8 rounded-full flex items-center justify-center',
                          config.color
                        )}>
                          <Icon className="size-4" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[40px]" />}
                      </div>

                      {/* Content */}
                      <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                              config.color
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
                              <p className="text-xs text-slate-400">
                                From: {formatJsonValue(log.previousValue)}
                              </p>
                            )}
                            {log.newValue && (
                              <p className="text-xs text-slate-500">
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
        </div>
      )}
    </div>
  )
}
