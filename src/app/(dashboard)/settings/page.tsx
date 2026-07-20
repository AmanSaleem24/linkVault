'use client'

import useSWR from 'swr'
import { SettingsClient } from '@/components/settings/settings-client'
import { getUserSettingsAction } from '@/app/actions/settings'

export default function SettingsPage() {
  const { data: result, isLoading } = useSWR('user-settings', getUserSettingsAction, { revalidateOnFocus: true })

  if (isLoading || !result) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-8 pb-24 lg:pt-12 animate-pulse">
        <div className="mb-8">
          <div className="h-9 w-32 bg-slate-200 rounded-md" />
          <div className="mt-2 h-5 w-64 bg-slate-200 rounded-md" />
        </div>
        <div className="space-y-6">
          <div className="h-[400px] w-full bg-slate-200 rounded-2xl" />
          <div className="h-[300px] w-full bg-slate-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!result.success || !result.data) {
    return (
      <div className="mx-auto max-w-4xl px-6 pt-8 pb-24 lg:pt-12">
        <div className="text-red-500">Failed to load settings. Please try again.</div>
      </div>
    )
  }

  const { name, email, hasPassword, isPro, defaultUtmSource, defaultUtmMedium, defaultUtmCampaign, defaultExpiresIn } = result.data

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
        initialName={name} 
        initialEmail={email} 
        hasPassword={hasPassword} 
        isPro={isPro}
        defaultUtmSource={defaultUtmSource}
        defaultUtmMedium={defaultUtmMedium}
        defaultUtmCampaign={defaultUtmCampaign}
        defaultExpiresIn={defaultExpiresIn}
      />
    </div>
  )
}
