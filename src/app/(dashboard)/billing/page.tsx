'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Zap, CheckCircle2, Clock, XCircle, CreditCard, Calendar, Shield, Sparkles, Receipt, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'
import { format } from 'date-fns'
import { BillingActions } from '@/components/billing/billing-actions'
import { getBillingDetailsAction } from '@/app/actions/billing'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function BillingPage() {
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('upgraded') === 'true'
  const showPending = searchParams.get('pending') === 'true'

  const { data: result, isLoading } = useSWR('billing-details', getBillingDetailsAction, { revalidateOnFocus: true })

  if (isLoading || !result) {
    return (
      <div className="global-content py-8">
        <div className="mb-8">
          <div className="h-8 w-48 skeleton rounded-md" />
          <div className="mt-3 h-4 w-72 skeleton rounded-md" />
        </div>
        <div className="space-y-8">
          <div className="h-[200px] w-full skeleton rounded-xl" />
          <div className="h-[150px] w-full skeleton rounded-xl" />
        </div>
      </div>
    )
  }

  if (!result.success || !result.data) {
    return (
      <div className="global-content py-8">
        <div className="text-red-500">Failed to load billing details. Please try again.</div>
      </div>
    )
  }

  const { subscription, isPro: pro } = result.data

  return (
    <div className="global-content py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Plan & Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Banners */}
      {showSuccess && (
        <div className="mb-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 flex items-center gap-3">
          <CheckCircle2 className="size-4" />
          Your payment was successful. Premium features are now active.
        </div>
      )}
      
      {showPending && (
        <div className="mb-8 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-600 flex items-center gap-3">
          <Clock className="size-4" />
          Activating your subscription. Please refresh the page in a minute.
        </div>
      )}

      <div className="space-y-8">
        
        {/* ── SECTION: Current Plan ── */}
        <section className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-base font-semibold">Current Plan</h2>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-bold tracking-tight">{pro ? 'Pro' : 'Free'}</p>
                  {pro ? (
                    subscription?.cancelAtPeriodEnd ? (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-500/20">
                        Cancels Soon
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                        Active
                      </span>
                    )
                  ) : (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border/40">
                      Basic
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pro ? (
                    <>Billed <span className="font-medium text-foreground">₹99.00</span> per month.</>
                  ) : (
                    'Free forever, with basic limits.'
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/40 bg-muted/20 px-6 sm:px-8 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
            {pro && subscription ? (
              <div className="w-full">
                <BillingActions
                  cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                  subscriptionId={subscription.razorpaySubscriptionId}
                />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Unlock advanced analytics, custom domains, and unlimited links.
                </p>
                <Link href="/pricing" className="shrink-0">
                  <Button className="h-8 rounded-md bg-foreground px-4 text-xs font-medium text-background hover:bg-foreground/90">
                    Upgrade to Pro
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ── SECTION: Billing Details (Pro Only) ── */}
        {pro && subscription && (
          <section className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-base font-semibold">Payment & Invoicing</h2>
              <div className="mt-6 space-y-6">
                <div className="grid gap-1 sm:grid-cols-3">
                  <div className="text-sm font-medium text-muted-foreground">Next Invoice</div>
                  <div className="col-span-2 text-sm text-foreground">
                    {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                  </div>
                </div>
                <div className="grid gap-1 sm:grid-cols-3">
                  <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                  <div className="col-span-2 flex items-center gap-2 text-sm text-foreground">
                    <Shield className="size-4 text-muted-foreground" />
                    Securely managed via Razorpay
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* ── SECTION: Recent Invoices (Pro Only) ── */}
        {pro && (
          <section className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-base font-semibold mb-4">Invoice History</h2>
              <div className="rounded-lg border border-border/40 divide-y divide-border/40 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-muted/10 transition-colors hover:bg-muted/20">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Pro Plan Subscription</p>
                    <p className="text-muted-foreground mt-0.5">{format(new Date(), 'MMMM d, yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">₹99.00</span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                      Paid
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
