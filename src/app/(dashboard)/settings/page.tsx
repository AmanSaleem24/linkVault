import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/settings-client'
import { prisma } from '@/lib/prisma'
import { getCurrentUserSubscription, isPro } from '@/lib/plan'

export const metadata = {
  title: 'Settings | LinkVault',
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Fetch fresh user data to ensure we have the latest name/email and to check if they have a password
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      name: true, 
      email: true, 
      passwordHash: true,
      defaultUtmSource: true,
      defaultUtmMedium: true,
      defaultUtmCampaign: true,
      defaultExpiresIn: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  const hasPassword = !!user.passwordHash
  const subscription = await getCurrentUserSubscription()
  const userIsPro = session.user.role === 'admin' || isPro(subscription)

  return (
    <div className="mx-auto max-w-4xl px-6 pt-8 pb-24 lg:pt-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-foreground sm:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-muted-foreground">
          Manage your account preferences and security.
        </p>
      </div>

      <SettingsClient 
        initialName={user.name} 
        initialEmail={user.email} 
        hasPassword={hasPassword} 
        isPro={userIsPro}
        defaultUtmSource={user.defaultUtmSource || ''}
        defaultUtmMedium={user.defaultUtmMedium || ''}
        defaultUtmCampaign={user.defaultUtmCampaign || ''}
        defaultExpiresIn={user.defaultExpiresIn || ''}
      />
    </div>
  )
}
