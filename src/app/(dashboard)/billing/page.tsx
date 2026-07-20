'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { ArrowLeft, Zap, CheckCircle2, Clock, XCircle, AlertTriangle, CreditCard, Calendar, Shield, Sparkles, Receipt, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'
import { format } from 'date-fns'
import { BillingActions } from '@/components/billing/billing-actions'
import { getBillingDetailsAction } from '@/app/actions/billing'
import { useSearchParams } from 'next/navigation'

export default function BillingPage() {
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('upgraded') === 'true'
  const showPending = searchParams.get('pending') === 'true'

  const { data: result, isLoading } = useSWR('billing-details', getBillingDetailsAction, { revalidateOnFocus: true })

  if (isLoading || !result) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-8 pb-24 lg:pt-12 animate-pulse">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="h-10 w-48 bg-slate-200 rounded-md" />
            <div className="mt-2 h-5 w-72 bg-slate-200 rounded-md" />
          </div>
        </div>
        <div className="grid gap-8">
          <div className="h-[300px] w-full bg-slate-200 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!result.success || !result.data) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-8 pb-24 lg:pt-12">
        <div className="text-red-500">Failed to load billing details. Please try again.</div>
      </div>
    )
  }

  const { subscription, isPro: pro } = result.data

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-24 lg:pt-12">

        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-foreground sm:text-4xl">
              Billing & Plan
            </h1>
            <p className="mt-2 text-base text-slate-500 dark:text-muted-foreground">
              Manage your subscription, payment method, and billing history.
            </p>
          </div>
          {!pro && (
            <Link href="/pricing">
              <Button className="h-10 gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-500 shadow-sm shadow-brand-500/20">
                <Zap className="size-4" fill="currentColor" />
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>

        {/* Banners */}
        {showSuccess && (
          <div className="animate-in fade-in slide-in-from-top-4 mb-8 flex items-start gap-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-5 shadow-sm backdrop-blur-md dark:border-emerald-800/40 dark:bg-emerald-950/40">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60">
              <Sparkles className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">Welcome to Pro! 🎉</p>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400/90">Your payment was successful. All Pro features are now instantly available.</p>
            </div>
          </div>
        )}

        {showPending && (
          <div className="animate-in fade-in slide-in-from-top-4 mb-8 flex items-start gap-4 rounded-2xl border border-blue-200/60 bg-blue-50/80 p-5 shadow-sm backdrop-blur-md dark:border-blue-800/40 dark:bg-blue-950/40">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60">
              <Clock className="size-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-base font-bold text-blue-800 dark:text-blue-300">Activating your subscription…</p>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-400/90">We're just waiting for the final confirmation from Razorpay. Give it a minute and refresh.</p>
            </div>
          </div>
        )}

        <div className="grid gap-8">
          
          {/* ── 1. Subscription Overview Card ───────────────────────────── */}
          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Current Plan</h2>
            
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
              
              {/* Pro Gradient Strip */}
              {pro && <div className="h-1.5 w-full bg-gradient-to-r from-brand-400 via-violet-400 to-brand-500" />}

              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  
                  {/* Left: Plan Info */}
                  <div className="flex items-center gap-5">
                    <div className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ${pro ? 'bg-brand-50 ring-brand-200/50 dark:bg-brand-900/20 dark:ring-brand-800/50' : 'bg-slate-50 ring-slate-200 dark:bg-muted dark:ring-border'}`}>
                      {pro ? <Zap className="size-6 text-brand-500 dark:text-brand-400" fill="currentColor" /> : <CreditCard className="size-6 text-slate-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-foreground">
                          {pro ? 'LinkVault Pro' : 'LinkVault Free'}
                        </h3>
                        {pro ? (
                          subscription?.cancelAtPeriodEnd ? (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              <XCircle className="size-3" />
                              Cancels soon
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              Active
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:bg-muted dark:text-muted-foreground">
                            Basic
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-500 dark:text-muted-foreground">
                        {pro ? (
                          <>
                            <span className="text-slate-900 dark:text-foreground font-semibold">₹99.00</span> per month
                          </>
                        ) : (
                          'Free forever'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: Billing Date */}
                  {pro && subscription?.currentPeriodEnd && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm dark:border-border dark:bg-muted/40 sm:text-right">
                      <p className="font-semibold text-slate-500 dark:text-muted-foreground">
                        {subscription.cancelAtPeriodEnd ? 'Access ends on' : 'Next billing date'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 sm:justify-end">
                        <Calendar className="size-4 text-brand-500 dark:text-brand-400" />
                        <span className="font-bold text-slate-900 dark:text-foreground">
                          {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-6 dark:border-border dark:bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                {pro && subscription ? (
                  <>
                    <p className="text-sm font-medium text-slate-500 dark:text-muted-foreground">
                      {subscription.cancelAtPeriodEnd
                        ? 'Your plan will not renew. You will lose Pro features at the end of the billing cycle.'
                        : 'Your plan automatically renews every month.'}
                    </p>
                    <BillingActions
                      cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
                      subscriptionId={subscription.razorpaySubscriptionId}
                    />
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-500 dark:text-muted-foreground">
                      You are currently on the Free plan. Upgrade to unlock unlimited features.
                    </p>
                    <Link href="/pricing" className="shrink-0">
                      <Button className="h-10 bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── 2. Payment Method & History ─────────────────────────────────── */}
          {pro && (
            <div className="grid gap-8 md:grid-cols-2">
              
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Payment Method</h2>
                <div className="flex h-32 flex-col justify-center rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-100 dark:bg-muted">
                      <CreditCard className="size-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-foreground">Razorpay Checkout</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-muted-foreground">
                        <Shield className="size-3" />
                        Managed securely via Razorpay
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Billing History</h2>
                <div className="flex h-32 flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-border dark:bg-card">
                  <Receipt className="mb-2 size-6 text-slate-300 dark:text-muted-foreground/50" />
                  <p className="text-sm font-medium text-slate-500 dark:text-muted-foreground">
                    Invoices are emailed directly to you by Razorpay.
                  </p>
                </div>
              </section>
              
            </div>
          )}

          {/* ── 3. Upsell / Benefits ────────────────────────────────────────── */}
          {!pro && (
            <section className="mt-4 overflow-hidden rounded-3xl border border-brand-200/50 bg-gradient-to-br from-white to-brand-50/50 shadow-sm dark:border-brand-900/30 dark:from-card dark:to-brand-950/20">
              <div className="p-8 sm:p-10">
                <div className="mx-auto max-w-2xl text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50">
                    <Sparkles className="size-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-foreground">Ready for more power?</h3>
                  <p className="mt-3 text-slate-500 dark:text-muted-foreground">
                    Upgrade to LinkVault Pro for just ₹99/month and supercharge your links.
                  </p>
                </div>
                
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {PLANS.pro.features.slice(0, 6).map((feature) => (
                    <div key={feature} className="flex items-start gap-3 rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-slate-100 dark:bg-card/40 dark:ring-border/50">
                      <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30">
                        <Check className="size-3 text-brand-500 dark:text-brand-400" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-foreground/90">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex justify-center">
                  <Link href="/pricing">
                    <Button className="group h-12 gap-2 rounded-xl bg-slate-900 px-8 text-base font-bold text-white hover:bg-slate-800 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90">
                      View Pricing
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          )}

      </div>
    </div>
  )
}
