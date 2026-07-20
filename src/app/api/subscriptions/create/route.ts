import { NextResponse } from 'next/server'
import { razorpay } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { invalidateSubscriptionCache } from '@/lib/plan'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const rateLimit = await checkRateLimit(`sub:create:${userId}`, 5, 60)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const planId = process.env.RAZORPAY_PLAN_PRO_MONTHLY
    if (!planId) {
      return NextResponse.json({ error: 'Subscription plan not configured' }, { status: 500 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID!

    const existing = await prisma.subscription.findUnique({ where: { userId } })

    // ── Case 1: Already an active subscriber ──────────────────────────────────
    // Should not happen (pricing page is hidden for pro users), but be defensive.
    if (existing?.status === 'ACTIVE') {
      return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 409 })
    }

    // ── Case 2: Previous checkout session is still in 'created' state ─────────
    // ONLY reuse if Razorpay also says 'created' — this is the only state where
    // the checkout modal can be opened fresh. 'authenticated' subs have already
    // had their mandate set up and cannot be re-opened in checkout; they wait for
    // automatic billing. Reusing them causes "id does not exist" errors.
    if (existing?.status === 'CREATED') {
      try {
        const rzpSub = await razorpay.subscriptions.fetch(existing.razorpaySubscriptionId)
        if (rzpSub.status === 'created') {
          console.log('[subscriptions/create] reusing created sub:', existing.razorpaySubscriptionId)
          return NextResponse.json({ subscriptionId: existing.razorpaySubscriptionId, keyId })
        }
        // Any other status (authenticated, halted, cancelled, etc.) — fall through to create fresh
        console.log('[subscriptions/create] existing sub not reusable, status:', rzpSub.status)
      } catch {
        // Sub doesn't exist on Razorpay (test-mode cleanup, wrong env, etc.) — create fresh
        console.log('[subscriptions/create] existing sub not found on Razorpay, creating new')
      }
    }

    // ── Case 3: Subscription is AUTHENTICATED but user came back to pay ───────
    // 'authenticated' means the mandate is set up but the first charge hasn't
    // been captured yet. Razorpay WILL charge it on the next billing cycle, but
    // you can't re-open checkout for it. We create a new subscription so the
    // user can complete payment through checkout right now.
    // The old AUTHENTICATED sub on Razorpay is abandoned and will expire.
    //
    // ── Case 4: PAST_DUE, CANCELLED, COMPLETED ───────────────────────────────
    // Always create fresh — these subs are done.

    // ── Create a brand-new Razorpay subscription ───────────────────────────────
    console.log('[subscriptions/create] creating new Razorpay subscription...')
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120,
      notes: { userId },
    })
    console.log('[subscriptions/create] created:', subscription.id)

    // Upsert — always exactly one Subscription row per user.
    // Overwrites razorpaySubscriptionId so stale IDs from old sessions are gone.
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        razorpaySubscriptionId: subscription.id,
        planId: 'pro_monthly',
        status: 'CREATED',
      },
      update: {
        razorpaySubscriptionId: subscription.id,
        planId: 'pro_monthly',
        status: 'CREATED',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      },
    })

    // Bust the subscription cache so the billing/home pages don't serve stale state
    await invalidateSubscriptionCache(userId)

    return NextResponse.json({ subscriptionId: subscription.id, keyId })
  } catch (error) {
    console.error('[subscriptions/create] error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create subscription'
    return NextResponse.json({ error: 'Failed to create subscription', message }, { status: 500 })
  }
}
