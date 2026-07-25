'use client'

import useSWR from 'swr'
import { QrManager } from '@/components/qr/qr-manager'
import { getQrPageDataAction } from '@/app/actions/qr'
import { FREE_TIER_LIMITS } from '@/lib/config'
import { useState } from 'react'

export default function QrPage() {
  const { data: result, isLoading } = useSWR('qr-page-data', getQrPageDataAction, { revalidateOnFocus: true })
  const [appUrl] = useState(() =>
    process.env.NEXT_PUBLIC_APP_URL || 'https://link-vault-theta.vercel.app'
  )

  if (isLoading || !result) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 pt-8 pb-24 lg:pt-12 ">
        <div className="h-10 w-48 skeleton rounded-md" />
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-[300px] skeleton rounded-3xl" />
          <div className="h-[300px] skeleton rounded-3xl" />
          <div className="h-[300px] skeleton rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!result.success || !result.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-red-500">Failed to load QR codes: {result.error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pt-8 pb-24 lg:pt-12">
      <QrManager 
        qrCodes={result.data.qrCodes!} 
        isPro={result.data.isPro} 
        qrLimit={FREE_TIER_LIMITS.qr} 
        appUrl={appUrl} 
      />
    </div>
  )
}
