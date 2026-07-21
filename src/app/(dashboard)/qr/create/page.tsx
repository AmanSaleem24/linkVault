import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QrCreator } from '@/components/qr/qr-creator'
import { headers } from 'next/headers'
import { getCurrentUserSubscription, isPro } from '@/lib/plan'

export const metadata = {
  title: 'Create QR Code | LinkVault',
}

export default async function CreateQrPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const headersList = await headers()
  const host = headersList.get('host') || 'link-vault-theta.vercel.app'
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const appUrl = `${protocol}://${host}`

  const subscription = await getCurrentUserSubscription()
  const userIsPro = session.user.role === 'admin' || isPro(subscription)

  return (
    <div className="mx-auto max-w-6xl pt-8 pb-24 lg:pt-12">
      <QrCreator appUrl={appUrl} isPro={userIsPro} />
    </div>
  )
}
