'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, XCircle } from 'lucide-react'

interface BillingActionsProps {
  cancelAtPeriodEnd: boolean
  subscriptionId: string
}

export function BillingActions({ cancelAtPeriodEnd }: BillingActionsProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = useCallback(async () => {
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Failed to cancel')
      }
      toast.success('Subscription cancelled. You keep Pro access until the end of the billing period.')
      setShowConfirm(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }, [router])

  if (cancelAtPeriodEnd) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-muted-foreground">
          Cancellation is scheduled. You keep Pro access until the end of your billing period.
        </p>
        <Button variant="outline" disabled className="shrink-0 text-sm">
          Cancellation scheduled
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-muted-foreground">
          Cancel anytime. You keep Pro access until the end of your current billing period.
        </p>
        <Button
          variant="outline"
          className="shrink-0 border-slate-200 text-sm text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-border dark:text-foreground dark:hover:border-destructive/40 dark:hover:bg-destructive/10 dark:hover:text-destructive"
          onClick={() => setShowConfirm(true)}
        >
          Cancel plan
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-50 dark:bg-destructive/10">
              <XCircle className="size-5 text-red-500 dark:text-destructive" />
            </div>
            <DialogTitle className="text-base">Cancel your Pro subscription?</DialogTitle>
            <DialogDescription className="text-sm">
              Your Pro features stay active until the end of your current billing period.
              After that, your account reverts to the Free plan. You can resubscribe anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={cancelling}
              className="text-sm"
            >
              Keep Pro
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
              className="gap-2 text-sm"
            >
              {cancelling ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Cancelling…
                </>
              ) : (
                'Yes, cancel'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}