'use client'

import useSWR from 'swr'
import { LockedPage } from '@/components/dashboard/locked-page'
import { AuditTimeline } from '@/components/dashboard/audit-timeline'
import { getAuditPageDataAction } from '@/app/actions/links.read'

export default function AuditLogPage() {
  const { data: result, isLoading, mutate, isValidating } = useSWR('audit-page-data', getAuditPageDataAction, { revalidateOnFocus: true })

  if (isLoading || !result) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 ">
        <div className="mb-8">
          <div className="h-8 w-48 skeleton rounded-md" />
          <div className="mt-2 h-5 w-64 skeleton rounded-md" />
        </div>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="mt-1 h-10 w-10 shrink-0 skeleton rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-full max-w-md skeleton rounded-md" />
              <div className="h-4 w-32 skeleton rounded-md" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1 h-10 w-10 shrink-0 skeleton rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-full max-w-md skeleton rounded-md" />
              <div className="h-4 w-32 skeleton rounded-md" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="mt-1 h-10 w-10 shrink-0 skeleton rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-full max-w-md skeleton rounded-md" />
              <div className="h-4 w-32 skeleton rounded-md" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result.success || !result.data) {
    return (
      <div className="global-content py-8 text-sm text-red-600">
        Failed to load audit log: {result.error}
      </div>
    )
  }

  const { isPro, logs, totalCount } = result.data

  if (!isPro) {
    return (
      <LockedPage
        title="Activity Log is Pro only"
        description="Upgrade to LinkVault Pro to track every action taken on your links — who created, updated, or deleted them and when."
      />
    )
  }

  return <AuditTimeline initialLogs={logs} totalCount={totalCount} onRefresh={() => mutate()} isRefreshing={isValidating} />
}
