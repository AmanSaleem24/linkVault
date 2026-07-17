'use server'

import { auth } from '@/lib/auth'

export async function getUserRoleAction(): Promise<{ isPro: boolean }> {
  const session = await auth()
  if (!session?.user?.role) {
    return { isPro: false }
  }
  return { isPro: session.user.role === 'admin' || session.user.role === 'pro' }
}
