'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Zap, Shield, Clock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string
      subscription_id: string
      name: string
      description: string
      handler: (response: {
        razorpay_payment_id: string
        razorpay_subscription_id: string
        razorpay_signature: string
      }) => void
      modal?: { ondismiss?: () => void; confirm_close?: boolean }
      theme?: { color?: string }
    }) => { open: () => void }
  }
}

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)
    const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = RAZORPAY_CHECKOUT_URL
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

interface PricingClientProps {
  freePlan: { name: string; price: number; features: readonly string[] }
  proPlan: { name: string; price: number; features: readonly string[] }
}

const TRUST_BADGES = [
  { icon: Shield, text: 'Secured by Razorpay' },
  { icon: Clock, text: 'Cancel anytime' },
  { icon: Zap, text: 'Instant activation' },
]

export function PricingClient({ freePlan, proPlan }: PricingClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const isLoadingRef = useRef(false)

  const setLoading = useCallback((loading: boolean, msg: string | null = null) => {
    isLoadingRef.current = loading
    setIsLoading(loading)
    setStatusMessage(msg)
  }, [])

  const pollUntilActive = useCallback(async () => {
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      try {
        const res = await fetch('/api/subscriptions/status')
        if (res.ok) {
          const { status } = await res.json() as { status: string }
          if (status === 'ACTIVE') {
            toast.success('Welcome to Pro! 🎉')
            router.push('/billing?upgraded=true')
            return
          }
        }
      } catch { /* keep polling */ }
    }
    toast.info('Payment received! Activation in progress.')
    router.push('/billing?pending=true')
  }, [router])

  async function handleUpgrade() {
    if (isLoadingRef.current) return
    setLoading(true, 'Setting up your subscription…')

    try {
      const createRes = await fetch('/api/subscriptions/create', { method: 'POST' })
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Failed to start subscription')
      }

      const body = await createRes.json() as { subscriptionId?: string; keyId?: string }
      const { subscriptionId, keyId } = body
      if (!subscriptionId || !keyId) throw new Error('Invalid response from server')

      setStatusMessage('Loading payment gateway…')
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Could not load Razorpay. Check your internet connection.')

      setStatusMessage(null)

      const checkout = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'LinkVault',
        description: 'LinkVault Pro — ₹99/month',
        theme: { color: '#3D52A0' },
        handler: async (response) => {
          setLoading(true, 'Confirming your payment…')
          try {
            const verifyRes = await fetch('/api/subscriptions/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            })
            if (verifyRes.ok) {
              const { status } = await verifyRes.json() as { status: string }
              if (status === 'ACTIVE') {
                toast.success('Welcome to Pro! 🎉')
                router.push('/billing?upgraded=true')
                return
              }
              setLoading(true, 'Finalising your subscription…')
              await pollUntilActive()
            } else {
              setLoading(true, 'Almost there…')
              await pollUntilActive()
            }
          } catch {
            toast.info('Payment received! Activation in progress.')
            router.push('/billing?pending=true')
          }
        },
        modal: {
          ondismiss: () => {
            if (isLoadingRef.current) {
              setLoading(false, null)
              toast.info('Checkout closed. Come back anytime to upgrade!')
            }
          },
        },
      })

      checkout.open()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false, null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">

      {/* Status banner */}
      {statusMessage && (
        <div className="mx-auto mb-8 flex max-w-md animate-in fade-in slide-in-from-top-2 items-center justify-center gap-3 rounded-2xl border border-brand-200/50 bg-white/50 px-5 py-3.5 text-sm font-semibold text-brand-600 shadow-sm backdrop-blur-md dark:border-brand-400/20 dark:bg-brand-400/10 dark:text-brand-300">
          <Loader2 className="size-4 animate-spin text-brand-500 dark:text-brand-400" />
          {statusMessage}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">

        {/* ── Free ───────────────────────────────────────────────── */}
        <div className="relative flex flex-col rounded-[2.5rem] border border-slate-200/60 bg-white/60 p-8 backdrop-blur-xl transition-all duration-300 hover:border-slate-300/80 hover:bg-white/80 dark:border-border/50 dark:bg-card/40 dark:hover:border-border dark:hover:bg-card/60 sm:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Free</p>
            <div className="mt-4 flex items-end gap-1.5">
              <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-foreground">₹0</span>
              <span className="mb-1.5 text-base font-medium text-slate-400 dark:text-muted-foreground">/mo</span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">Perfect for trying out LinkVault.</p>
          </div>

          <ul className="mt-10 flex-1 space-y-4">
            {freePlan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-muted">
                  <Check className="size-3 text-slate-400 dark:text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-muted-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Button variant="outline" className="h-12 w-full rounded-xl text-base font-semibold" disabled>
              Current plan
            </Button>
          </div>
        </div>

        {/* ── Pro ────────────────────────────────────────────────── */}
        <div className="group relative flex flex-col rounded-[2.5rem] bg-white shadow-2xl shadow-brand-500/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-500/20 dark:bg-card dark:shadow-none">
          {/* Animated gradient border container */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-brand-400 via-violet-400 to-brand-600 opacity-100 p-[2px] transition-opacity duration-500 group-hover:from-brand-300 group-hover:via-fuchsia-400 group-hover:to-brand-500">
            {/* Inner background to mask the gradient except for the border */}
            <div className="absolute inset-[2px] rounded-[2.4rem] bg-white dark:bg-card" />
          </div>

          {/* Recommended pill */}
          <div className="absolute -top-4 left-0 right-0 mx-auto flex w-max items-center justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-brand-500/30 dark:from-brand-400 dark:to-violet-400">
              <Zap className="size-3.5 fill-white" />
              Recommended
            </div>
          </div>

          <div className="relative z-10 flex flex-1 flex-col p-8 sm:p-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand-500 dark:text-brand-400">Pro</p>
              <div className="mt-4 flex items-end gap-1.5">
                <span className="text-5xl font-black tracking-tight text-slate-900 dark:text-foreground">₹99</span>
                <span className="mb-1.5 text-base font-medium text-slate-400 dark:text-muted-foreground">/mo</span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">For true professionals. Cancel anytime.</p>
            </div>

            <ul className="mt-10 flex-1 space-y-4">
              {proPlan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-400/15">
                    <Check className="size-3.5 text-brand-500 dark:text-brand-400" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-foreground/90">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="group/btn relative h-14 w-full overflow-hidden rounded-xl bg-slate-900 text-base font-bold text-white transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] dark:bg-brand-400 dark:hover:bg-brand-500 dark:hover:shadow-brand-400/20"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                
                <div className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      {statusMessage ?? 'Loading…'}
                    </>
                  ) : (
                    <>
                      Upgrade to Pro
                      <ArrowRight className="size-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
        {TRUST_BADGES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/40 px-4 py-2 text-xs font-semibold text-slate-500 backdrop-blur-sm dark:border-border/50 dark:bg-card/20 dark:text-muted-foreground">
            <Icon className="size-4" />
            {text}
          </div>
        ))}
      </div>

    </div>
  )
}