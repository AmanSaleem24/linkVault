'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { CheckCircle2, Clock, CreditCard, Receipt, Check, Zap, XCircle, Calendar, Shield, Sparkles } from 'lucide-react'
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
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-32 lg:pt-20">
        <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="h-14 w-72 skeleton rounded-2xl" />
            <div className="mt-4 h-6 w-96 skeleton rounded-xl" />
          </div>
        </div>
        <div className="h-[400px] w-full skeleton rounded-[3rem]" />
      </div>
    )
  }

  if (!result.success || !result.data) {
    return (
      <div className="mx-auto max-w-5xl px-6 pt-12 pb-32 lg:pt-20">
        <div className="rounded-[2rem] border-2 border-red-200/50 bg-red-50 p-8 text-lg font-medium text-red-600 shadow-xl shadow-red-500/10 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
          Oops! We couldn&apos;t load your billing details right now. Please try again.
        </div>
      </div>
    )
  }

  const { subscription, isPro: pro } = result.data

  return (
    <div className="relative min-h-screen overflow-hidden">
      
      {/* ── Playful Mesh Gradient Background ── */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-start justify-center overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] h-[40rem] w-[40rem] animate-pulse rounded-full bg-brand-400/40 blur-[140px] mix-blend-multiply" />
        <div className="absolute top-[0%] right-[-10%] h-[35rem] w-[35rem] animate-pulse rounded-full bg-violet-400/40 blur-[120px] mix-blend-multiply delay-1000" />
        <div className="absolute top-[20%] left-[20%] h-[30rem] w-[30rem] animate-pulse rounded-full bg-fuchsia-400/30 blur-[100px] mix-blend-multiply delay-2000" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-12 pb-32 lg:pt-20">
        
        {/* ── Header ── */}
        <div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground sm:text-6xl">
              Billing & <span className="bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">Plan</span>
            </h1>
            <p className="mt-4 text-lg font-medium text-muted-foreground sm:text-xl">
              Manage your workspace, update payments, and view history.
            </p>
          </div>
          {!pro && (
            <Link href="/pricing">
              <Button className="group h-12 gap-2 rounded-2xl bg-foreground px-6 text-base font-bold text-background shadow-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:bg-brand-500 hover:text-white hover:shadow-brand-500/25">
                <Sparkles className="size-5 transition-transform duration-500 group-hover:scale-110" />
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>

        {/* ── Banners ── */}
        {showSuccess && (
          <div className="mb-12 flex animate-in zoom-in-95 items-center gap-5 rounded-[2rem] bg-gradient-to-r from-emerald-400 to-emerald-500 p-6 text-white shadow-2xl shadow-emerald-500/20">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <CheckCircle2 className="size-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">You&apos;re officially Pro! 🎉</p>
              <p className="mt-1 text-emerald-50 font-medium">Payment successful. Your premium features are ready to use.</p>
            </div>
          </div>
        )}

        {showPending && (
          <div className="mb-12 flex animate-in zoom-in-95 items-center gap-5 rounded-[2rem] bg-gradient-to-r from-blue-400 to-blue-500 p-6 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Clock className="size-6 animate-spin text-white" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">Activating your superpowers...</p>
              <p className="mt-1 text-blue-50 font-medium">Waiting for Razorpay to confirm the payment. Grab a coffee and refresh!</p>
            </div>
          </div>
        )}

        <div className="grid gap-8">
          
          {/* ── 1. The Hero Plan Card ── */}
          <section>
            <div className={`group relative overflow-hidden rounded-[2.5rem] border-2 bg-card/60 shadow-xl backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:shadow-2xl dark:bg-slate-900/50 ${pro ? 'border-brand-200 hover:border-brand-400 hover:shadow-brand-500/20 dark:border-brand-900/50 dark:hover:border-brand-500/50' : 'border-border/50 hover:border-border hover:shadow-border/10 dark:border-white/10 dark:hover:border-white/20'}`}>
              
              <div className="p-8 sm:p-12">
                <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
                  
                  {/* Left: Plan Info */}
                  <div className="flex items-center gap-6">
                    <div className={`flex size-20 shrink-0 items-center justify-center rounded-[1.5rem] shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${pro ? 'bg-gradient-to-br from-brand-400 to-violet-500 text-white shadow-brand-500/30' : 'bg-muted/80 text-muted-foreground dark:bg-slate-800'}`}>
                      {pro ? <Zap className="size-10" fill="currentColor" /> : <CreditCard className="size-10" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black tracking-tighter text-foreground sm:text-4xl">
                          {pro ? 'LinkVault Pro' : 'LinkVault Free'}
                        </h2>
                        {pro ? (
                          subscription?.cancelAtPeriodEnd ? (
                            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              <XCircle className="size-4" />
                              Cancels soon
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
                              <div className="size-2 rounded-full bg-brand-500 animate-pulse" />
                              Active Plan
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-muted/80 px-3 py-1 text-sm font-bold text-muted-foreground">
                            Basic
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        {pro ? (
                          <>
                            <span className="text-xl font-bold text-muted-foreground line-through opacity-50">₹199</span>
                            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-3xl font-black text-transparent dark:from-brand-400 dark:to-violet-400 sm:text-4xl">₹99</span>
                            <span className="text-lg font-bold text-muted-foreground">/mo</span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold text-muted-foreground sm:text-3xl">Free forever</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Billing Date */}
                  {pro && subscription?.currentPeriodEnd && (
                    <div className="rounded-[1.5rem] bg-muted/40 p-6 text-sm ring-1 ring-inset ring-border/50 transition-colors duration-500 group-hover:bg-brand-50/50 dark:group-hover:bg-brand-900/10 sm:text-right">
                      <p className="font-bold text-muted-foreground">
                        {subscription.cancelAtPeriodEnd ? 'Access ends on' : 'Next billing date'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 sm:justify-end">
                        <Calendar className="size-5 text-brand-500 dark:text-brand-400" />
                        <span className="text-xl font-black tracking-tight text-foreground">
                          {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col gap-6 bg-muted/30 p-8 dark:bg-slate-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-12">
                {pro && subscription ? (
                  <>
                    <p className="text-base font-medium text-muted-foreground">
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
                    <p className="text-base font-medium text-muted-foreground">
                      You are currently on the Free plan. Upgrade to unlock unlimited features.
                    </p>
                    <Link href="/pricing" className="shrink-0">
                      <Button className="h-12 rounded-2xl bg-foreground px-8 font-bold text-background shadow-lg transition-all duration-300 hover:scale-105 hover:bg-brand-500 hover:text-white">
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── 2. Payment & History Floating Cards ── */}
          {pro && (
            <div className="grid gap-8 md:grid-cols-2">
              
              <section>
                <div className="group flex h-[180px] flex-col justify-center rounded-[2.5rem] border-2 border-border/40 bg-card/40 p-10 shadow-lg backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-500/10 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-brand-500/50">
                  <div className="flex items-center gap-6">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-brand-50 text-brand-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 dark:bg-brand-500/10 dark:text-brand-400">
                      <CreditCard className="size-8" />
                    </div>
                    <div>
                      <p className="text-2xl font-black tracking-tight text-foreground">Razorpay</p>
                      <p className="mt-1 flex items-center gap-2 text-base font-medium text-muted-foreground">
                        <Shield className="size-4" />
                        Secure Checkout
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="group flex h-[180px] flex-col items-center justify-center rounded-[2.5rem] border-2 border-border/40 bg-card/40 p-10 text-center shadow-lg backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2 hover:border-violet-300 hover:shadow-2xl hover:shadow-violet-500/10 dark:border-white/10 dark:bg-slate-900/40 dark:hover:border-violet-500/50">
                  <div className="mb-4 flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-violet-50 text-violet-500 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110 dark:bg-violet-500/10 dark:text-violet-400">
                    <Receipt className="size-7" />
                  </div>
                  <p className="text-base font-medium text-muted-foreground">
                    Invoices are emailed directly via Razorpay.
                  </p>
                </div>
              </section>
              
            </div>
          )}

          {/* ── 3. The Stripe-style Upsell ── */}
          {!pro && (
            <section className="relative mt-8 overflow-hidden rounded-[3rem] border-0 bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-600 p-[2px] shadow-2xl transition-all duration-500 hover:shadow-brand-500/30">
              
              <div className="relative flex h-full flex-col gap-10 rounded-[calc(3rem-2px)] bg-white/95 p-10 backdrop-blur-3xl dark:bg-slate-950/95 sm:p-14 md:flex-row md:items-center md:justify-between">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-brand-100/50 to-transparent dark:from-brand-500/10" />

                <div className="relative max-w-xl">
                  <div className="mb-6 flex size-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-brand-400 to-violet-500 shadow-lg shadow-brand-500/20">
                    <Sparkles className="size-8 text-white" />
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">Supercharge your workflow</h3>
                  <p className="mt-5 text-xl font-medium text-muted-foreground">
                    Upgrade to LinkVault Pro for just <span className="font-bold text-foreground">₹99/month</span>. Get advanced analytics, custom slugs, and team features today.
                  </p>
                  
                  <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {PLANS.pro.features.slice(0, 5).map(feature => (
                      <div key={feature} className="flex items-center gap-3">
                         <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/60">
                            <Check className="size-4 font-bold text-brand-600 dark:text-brand-400" strokeWidth={3} />
                         </div>
                         <span className="text-base font-bold text-foreground/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="relative flex shrink-0 items-center justify-center md:justify-end">
                   <Link href="/pricing">
                     <Button className="group h-16 rounded-[1.25rem] bg-gradient-to-br from-brand-500 to-violet-600 px-10 text-xl font-black text-white shadow-xl shadow-brand-500/20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-brand-500/40">
                       Upgrade to Pro
                     </Button>
                   </Link>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  )
}
