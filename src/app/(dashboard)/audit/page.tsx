import { getUserRoleAction } from '@/app/actions/user.getRole'
import { LockedPage } from '@/components/dashboard/locked-page'
import { AuditTimeline } from '@/components/dashboard/audit-timeline'
import { getAuditLogAction } from '@/app/actions/links.read'

export const dynamic = 'force-dynamic'

export default async function AuditLogPage() {
  const { isPro } = await getUserRoleAction()

  if (!isPro) {
    return (
      <LockedPage
        title="Activity Log"
        description="Track every action taken on your links — who created, updated, or deleted them and when. Available for Pro users."
      />
    )
  }

  // Pro: fetch initial batch of audit logs
  const result = await getAuditLogAction({ limit: 20 })

  if (!result.success) {
    return (
      <div className="global-content py-8 text-sm text-red-600">
        Failed to load audit log: {result.error}
      </div>
    )
  }

  return <AuditTimeline initialLogs={result.data.logs} totalCount={result.data.totalCount} />
}
