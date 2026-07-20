'use server'

import { getCurrentUserSubscription, isPro } from '@/lib/plan'
import { auth } from '@/lib/auth'

export async function getBillingDetailsAction() {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

  try {
    const subscription = await getCurrentUserSubscription()
    const userIsPro = session.user.role === 'admin' || isPro(subscription)

    return {
      success: true,
      data: {
        subscription,
        isPro: userIsPro,
      }
    }
  } catch (error) {
    console.error('Get billing details error:', error)
    return { success: false, error: 'Failed to fetch billing details' }
  }
}
