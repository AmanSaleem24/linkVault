import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QrManager } from '@/components/qr/qr-manager'
import { getQrCodes } from '@/app/actions/qr'
import { getCurrentUserSubscription, isPro } from '@/lib/plan'
import { FREE_TIER_LIMITS } from '@/lib/config'
import { headers } from 'next/headers'

export const metadata = {
  title: 'QR Codes | LinkVault',
}

export default async function QrPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const [qrRes, subscription] = await Promise.all([
    getQrCodes(),
    getCurrentUserSubscription(),
  ])

  if (!qrRes.success) {
    // Basic error state
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-red-500">Failed to load QR codes.</p>
      </div>
    )
  }

  const userIsPro = session.user.role === 'admin' || isPro(subscription)

  const headersList = await headers()
  const host = headersList.get('host') || 'linkvault.io'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const appUrl = `${protocol}://${host}`

  return (
    <div className="mx-auto max-w-6xl space-y-6 pt-8 pb-24 lg:pt-12">
      <QrManager qrCodes={qrRes.data!} isPro={userIsPro} qrLimit={FREE_TIER_LIMITS.qr} appUrl={appUrl} />
    </div>
  )
}
