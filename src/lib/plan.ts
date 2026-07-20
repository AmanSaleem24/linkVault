import { SubscriptionStatus } from '@prisma/client'
import { getRedis } from './redis'
import { prisma } from '@/lib/prisma'
import { auth } from './auth'

const SUB_CACHE_KEY = (userId: string) => `sub:${userId}`
const SUB_CACHE_TTL = 30 // seconds

export type SubscriptionData = {
  id: string
  razorpaySubscriptionId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
} | null

export function isPro(subscription: SubscriptionData): boolean {
  return subscription?.status === 'ACTIVE'
}

export async function getCurrentUserSubscription(): Promise<SubscriptionData> {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id

  const cached = await getRedis()
  if (cached) {
    const hit = await cached.get<SubscriptionData>(SUB_CACHE_KEY(userId))
    if (hit) return hit
  }

  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      id: true,
      razorpaySubscriptionId: true,
      planId: true,
      status: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  })

  const result: SubscriptionData = sub
    ? {
        id: sub.id,
        razorpaySubscriptionId: sub.razorpaySubscriptionId,
        planId: sub.planId,
        status: sub.status,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      }
    : null

  if (cached) {
    await cached.set(SUB_CACHE_KEY(userId), result, { ex: SUB_CACHE_TTL })
  }

  return result
}

export async function invalidateSubscriptionCache(userId: string): Promise<void> {
  const cached = getRedis()
  if (cached) {
    await cached.del(SUB_CACHE_KEY(userId))
  }
}
