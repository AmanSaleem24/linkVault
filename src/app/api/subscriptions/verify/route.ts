import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getRazorpay } from '@/lib/razorpay'
import { auth } from '@/lib/auth'
import { invalidateSubscriptionCache } from '@/lib/plan'

function verifySignature(
  paymentId: string,
  subscriptionId: string,
  signature: string,
  secret: string
): boolean {
  const payload = `${paymentId}|${subscriptionId}`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as {
      razorpay_payment_id?: string
      razorpay_subscription_id?: string
      razorpay_signature?: string
    }

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification fields' },
        { status: 400 }
      )
    }

    // ── 1. Verify the HMAC signature ─────────────────────────────────────────
    // Razorpay only produces a valid signature for razorpay_payment_id|razorpay_subscription_id
    // when a real charge has been successfully processed. A valid signature IS
    // proof of payment — we can safely mark the subscription ACTIVE here rather
    // than waiting for a webhook (which can't reach localhost in dev).
    const isValid = verifySignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET!
    )

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // ── 2. Look up our subscription record ───────────────────────────────────
    const subscription = await prisma.subscription.findUnique({
        where: { razorpaySubscriptionId: razorpay_subscription_id },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // ── 3. Mark ACTIVE (signature = confirmed payment) ───────────────────────
    // Optionally fetch from Razorpay to get currentPeriodEnd — but we no longer
    // use the API status to decide whether to activate; the signature already
    // proved the payment. We still try to get billing dates for a better UX.
    let currentPeriodEnd: Date | null = subscription.currentPeriodEnd
    try {
      const rzpSub = await getRazorpay().subscriptions.fetch(razorpay_subscription_id)
      if (rzpSub.current_end && rzpSub.current_end > 0) {
        currentPeriodEnd = new Date(rzpSub.current_end * 1000)
      }
    } catch {
      // If we can't reach Razorpay, we'll use the fallback below
    }

    // Fallback: If we couldn't get the date from Razorpay, assume 30 days from now
    if (!currentPeriodEnd) {
      currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    await prisma.subscription.update({
        where: { userId: subscription.userId },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
    })

    await invalidateSubscriptionCache(subscription.userId)

    return NextResponse.json({ status: 'ACTIVE' })
  } catch (error) {
    console.error('[subscriptions/verify] error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
