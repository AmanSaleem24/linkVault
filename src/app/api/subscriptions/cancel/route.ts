import { NextResponse } from 'next/server'
import { getRazorpay } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { invalidateSubscriptionCache } from '@/lib/plan'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  const rateLimit = await checkRateLimit(`sub:cancel:${userId}`, 3, 60)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    if (subscription.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await getRazorpay().subscriptions.cancel(subscription.razorpaySubscriptionId, true)

    await prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    })

    await invalidateSubscriptionCache(userId)

    return NextResponse.json({ success: true, cancelAtPeriodEnd: true })
  } catch (error) {
    console.error('[subscriptions/cancel] error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
