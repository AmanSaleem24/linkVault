import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCurrentUserSubscription } from '@/lib/plan'
import { PLANS } from '@/lib/plans'
import { PricingClient } from '@/components/pricing/pricing-client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Sparkles, Zap } from 'lucide-react'

export default async function PricingPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?returnTo=/pricing')
  }

  const subscription = await getCurrentUserSubscription()
  const isPro = subscription?.status === 'ACTIVE'

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-background overflow-hidden">
      {/* Premium Background Effects */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="absolute -top-40 h-[600px] w-[1000px] rounded-full bg-brand-400/10 blur-[100px] dark:bg-brand-400/15"></div>
        <div className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/4 rounded-full bg-violet-400/10 blur-[120px] dark:bg-violet-600/15"></div>
        <div className="absolute left-0 top-60 h-[500px] w-[500px] -translate-x-1/3 rounded-full bg-brand-200/20 blur-[120px] dark:bg-brand-900/30"></div>
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-12 lg:py-20">
        
        <Link
          href="/home"
          className="group mb-12 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
        >
          <div className="flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-all group-hover:border-slate-300 dark:border-border dark:bg-card">
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          </div>
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mb-14 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mx-auto mb-6 flex max-w-fit items-center gap-2 rounded-full border border-brand-200/50 bg-white/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-500 shadow-sm backdrop-blur-md dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
              <Sparkles className="size-3.5" />
              Simple Pricing
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-foreground sm:text-5xl md:text-6xl">
              Upgrade your <span className="bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent dark:from-brand-300 dark:to-violet-400">link game</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500 dark:text-muted-foreground">
              Start free and scale as you grow. The Pro plan unlocks the full power of LinkVault for true professionals.
            </p>
          </div>
        </div>

        {isPro ? (
          <div className="mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="group relative overflow-hidden rounded-[2rem] bg-white p-1 shadow-2xl shadow-emerald-500/10 transition-transform hover:-translate-y-1 dark:bg-card">
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-600 opacity-50 transition-opacity group-hover:opacity-100" />
              
              <div className="relative flex flex-col items-center rounded-[1.8rem] bg-white p-10 text-center dark:bg-background">
                <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50 dark:bg-emerald-950/40 dark:ring-emerald-900/20">
                  <CheckCircle2 className="size-10 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">
                  You&apos;re already on Pro!
                </h2>
                <p className="mt-3 text-base text-slate-500 dark:text-muted-foreground">
                  Enjoy unlimited links, full analytics, and all premium features.
                </p>
                <Link href="/billing" className="mt-8 w-full">
                  <Button className="h-12 w-full gap-2 rounded-xl bg-slate-900 text-base font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90">
                    Manage billing details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
            <PricingClient freePlan={PLANS.free} proPlan={PLANS.pro} />
          </div>
        )}

      </div>
    </div>
  )
}