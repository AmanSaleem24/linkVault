'use server'

import { getCurrentUserSubscription, isPro } from '@/lib/plan'

/**
 * Returns whether the current user has active Pro access.
 * Pro is granted by either:
 *  - session.user.role === 'admin' (always Pro)
 *  - an active Razorpay Subscription (status === 'ACTIVE')
 */
export async function getUserRoleAction(): Promise<{ isPro: boolean }> {
  const subscription = await getCurrentUserSubscription()
  return { isPro: isPro(subscription) }
}