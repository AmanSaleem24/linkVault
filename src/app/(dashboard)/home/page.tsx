'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Link2, Star, CheckCircle2, Globe, Sparkles, Lock, Copy, ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUserUsageStatsAction, createLinkAction } from '@/app/actions/links'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'

// Inlined at build-time — same value on server and first client render (no hydration mismatch).
const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ''

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [qrCode, setQrCode] = useState(true)
  const [expires, setExpires] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [stats, setStats] = useState<{ linkCount: number; qrCount: number; isPro: boolean; limits: { links: number; qr: number } } | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [createdData, setCreatedData] = useState<{ shortUrl: string, originalUrl: string, hasQr: boolean } | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  // Falls back to window.location.origin after mount so SSR and first render match.
  const [baseUrl, setBaseUrl] = useState(ENV_BASE_URL)

  useEffect(() => {
    if (!ENV_BASE_URL) setBaseUrl(window.location.origin)
  }, [])

  async function loadStats() {
    const res = await getUserUsageStatsAction()
    if (res.success && res.data) {
      setStats(res.data)
      // Auto-disable QR code if they hit the limit
      if (!res.data.isPro && res.data.qrCount >= res.data.limits.qr) {
        setQrCode(false)
      }
    }
    setLoadingStats(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  function validateUrl(value: string): string | null {
    if (!value) return 'Destination URL is required'
    try {
      const parsed = new URL(value)
      if (!['http:', 'https:'].includes(parsed.protocol)) return 'URL must start with http:// or https://'
      return null
    } catch {
      return 'Must be a valid URL (e.g. https://example.com)'
    }
  }

  async function handleCreate() {
    const err = validateUrl(url)
    if (err) {
      setUrlError(err)
      return
    }

    startTransition(async () => {
      const res = await createLinkAction({
        url,
        alias: alias || undefined,
        qrCode: qrCode,
        expiresAt: expires && expiresAt ? expiresAt : undefined,
      })

      if (res.success && res.data) {
        toast.success('Link created successfully!')
        setCreatedData({
          shortUrl: `${baseUrl}/${res.data.slug}`,
          originalUrl: url,
          hasQr: qrCode
        })
        setUrl('')
        setAlias('')
        setExpiresAt('')
        setExpires(false)
        await loadStats() // Refresh usage stats
      } else {
        toast.error(res.error || 'Failed to create link')
      }
    })
  }

  const isLinkLimitReached = stats && !stats.isPro && stats.linkCount >= stats.limits.links
  const isQrLimitReached = stats && !stats.isPro && stats.qrCount >= stats.limits.qr

  return (
    <div className="mx-4 mb-12 mt-6 max-w-6xl sm:mx-8 md:mx-12 xl:mx-auto xl:mt-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] lg:items-start">
        
        {/* ── Left Column: Form Card ── */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-10">
          {/* Header */}
          <div className="mb-10 flex items-start gap-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-gradient-to-b from-slate-50 to-slate-100/50 text-[#2B0094] shadow-sm">
              <Link2 className="size-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[1.4rem] font-semibold tracking-tight text-slate-900">
                Create Short Link
              </h1>
              <p className="mt-1 text-[0.95rem] font-medium text-slate-500">
                Transform long URLs into clean, shareable links.
              </p>
            </div>
          </div>

          {/* Usage Stats (Free Tier) */}
          {!loadingStats && stats && !stats.isPro && (
            <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-[0.85rem] font-semibold text-slate-700">Monthly Usage</span>
                <span className="rounded bg-white px-2 py-1 text-[0.7rem] font-bold text-[#2B0094] shadow-sm">Free Plan</span>
              </div>
              <div className="space-y-3">
                {/* Links Progress */}
                <div>
                  <div className="mb-1.5 flex justify-between text-[0.8rem] font-medium">
                    <span className="text-slate-600">Links Created</span>
                    <span className="text-slate-900">{stats.linkCount} / {stats.limits.links}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-[#3D00D1] to-[#2B0094] transition-all" 
                      style={{ width: `${Math.min(100, (stats.linkCount / stats.limits.links) * 100)}%` }} 
                    />
                  </div>
                </div>
                {/* QR Progress */}
                <div>
                  <div className="mb-1.5 flex justify-between text-[0.8rem] font-medium">
                    <span className="text-slate-600">QR Codes Generated</span>
                    <span className="text-slate-900">{stats.qrCount} / {stats.limits.qr}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-[#3D00D1] to-[#2B0094] transition-all" 
                      style={{ width: `${Math.min(100, (stats.qrCount / stats.limits.qr) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-8">
            {/* Destination URL */}
            <div className="space-y-2">
              <label className="text-[0.95rem] font-semibold text-slate-800 flex items-center gap-2">
                <Globe className="size-4.5 text-[#2B0094]" /> 
                Destination URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/my-long-url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(null) }}
                onBlur={() => setUrlError(validateUrl(url))}
                disabled={isLinkLimitReached || false}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-[0.95rem] text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:outline-none focus:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed ${
                  urlError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15 hover:border-red-400'
                    : 'border-slate-200 hover:border-slate-300 focus:border-[#2B0094] focus:ring-[#2B0094]/15'
                }`}
              />
              {urlError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500">
                  {urlError}
                </p>
              )}
            </div>

            {/* Custom Alias & Domain (Flex Row) */}
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex-1 space-y-2">
                <label className="text-[0.95rem] font-semibold text-slate-800 flex items-center gap-2">
                  <Link2 className="size-4.5 text-[#2B0094]" /> 
                  Domain
                </label>
                <div className="flex h-[50px] w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                  <span className="text-[0.95rem] font-medium text-slate-500">linkvault.com</span>
                  <Lock className="ml-auto size-4 text-slate-400" />
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-[0.95rem] font-semibold text-slate-800 flex items-center gap-2">
                  <Sparkles className="size-4.5 text-[#2B0094]" /> 
                  Custom Alias <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative flex h-[50px] items-center">
                  <span className="flex h-full items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 pl-4 pr-1 text-[0.95rem] font-medium text-slate-500">
                    /
                  </span>
                  <input
                    type="text"
                    placeholder="my-portfolio"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    disabled={isLinkLimitReached || false}
                    className="w-full h-full rounded-r-xl border border-slate-200 bg-white px-3 text-[0.95rem] text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[#2B0094] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {alias.length > 0 && (
                    <CheckCircle2 className="absolute right-3 top-1/2 size-4.5 -translate-y-1/2 text-green-500" strokeWidth={2.5} />
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-3.5">
              {/* QR Code Toggle */}
              <label className={`group flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${isQrLimitReached ? 'opacity-70' : 'hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md'}`}>
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={qrCode}
                    disabled={isQrLimitReached || isLinkLimitReached || false}
                    onChange={(e) => setQrCode(e.target.checked)}
                    className="size-4.5 rounded border-slate-300 accent-[#2B0094] transition-transform group-active:scale-95 disabled:cursor-not-allowed"
                  />
                  <span className="text-[0.95rem] font-medium text-slate-800">Generate QR Code</span>
                </div>
                {isQrLimitReached ? (
                  <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[0.75rem] font-bold text-slate-500">
                    <Lock className="size-3" /> LIMIT REACHED
                  </span>
                ) : (
                  <span className="rounded bg-slate-100 px-2 py-1 text-[0.75rem] font-semibold text-slate-500">Free</span>
                )}
              </label>

              {/* Expiration Date Toggle */}
              <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${!stats?.isPro ? 'opacity-80' : 'hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md'}`}>
                <label className={`group flex items-center justify-between ${!stats?.isPro ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="flex items-center gap-3.5">
                    <input
                      type="checkbox"
                      checked={expires}
                      onChange={(e) => setExpires(e.target.checked)}
                      disabled={!stats?.isPro || loadingStats}
                      className="size-4.5 rounded border-slate-300 accent-[#2B0094] transition-transform group-active:scale-95 disabled:cursor-not-allowed"
                    />
                    <span className="text-[0.95rem] font-medium text-slate-800">Expiration Date</span>
                  </div>
                  <div className="flex items-center gap-1 rounded border border-[#2B0094]/10 bg-[#ECEEFE] px-2 py-1 text-[0.75rem] font-bold text-[#2B0094] shadow-sm">
                    <Sparkles className="size-3 text-[#2B0094]" /> PRO
                  </div>
                </label>
                
                {expires && (
                  <div className="ml-[2.1rem] mt-4">
                    <label className="mb-1.5 block text-[0.8rem] font-medium text-slate-500">
                      Expires On
                    </label>
                    <input 
                      type="date" 
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={!stats?.isPro || loadingStats}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.95rem] text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-[#2B0094] focus:outline-none focus:ring-[3px] focus:ring-[#2B0094]/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" 
                    />
                  </div>
                )}
              </div>
              {/* Click Analytics (Static Up-sell) */}
              <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${!stats?.isPro ? 'opacity-80' : 'hover:-translate-y-[1px] hover:border-slate-300 hover:shadow-md'}`}>
                <label className={`group flex items-center justify-between ${!stats?.isPro ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`flex size-4.5 items-center justify-center rounded ${!stats?.isPro ? 'bg-slate-100' : 'bg-[#2B0094]/10'}`}>
                      <Lock className={`size-3 ${!stats?.isPro ? 'text-slate-400' : 'text-[#2B0094]'}`} strokeWidth={2.5} />
                    </div>
                    <span className="text-[0.95rem] font-medium text-slate-800">Click Analytics</span>
                  </div>
                  <div className="flex items-center gap-1 rounded border border-[#2B0094]/10 bg-[#ECEEFE] px-2 py-1 text-[0.75rem] font-bold text-[#2B0094] shadow-sm">
                    <Sparkles className="size-3 text-[#2B0094]" /> PRO
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleCreate}
              disabled={isLinkLimitReached || loadingStats || isPending}
              className="h-12 w-full rounded-xl border border-[#23007A] bg-gradient-to-b from-[#3D00D1] to-[#2B0094] px-10 text-[1rem] font-semibold text-white shadow-[0_2px_5px_rgba(43,0,148,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:from-[#4300E6] hover:to-[#3100A8] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 sm:w-auto"
            >
              {isPending ? 'Creating...' : isLinkLimitReached ? 'Limit Reached' : 'Create Short Link'}
            </Button>
          </div>
        </div>

        {/* ── Right Column: Minimalist Preview Panel ── */}
        <div className="sticky top-10 rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
          {createdData ? (
            // --- SUCCESS STATE SIDEBAR ---
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="border-b border-slate-100 bg-green-50/50 p-6 flex flex-col items-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="size-7 text-green-600" />
                </div>
                <h3 className="text-[1.1rem] font-bold text-slate-900">Your link is ready!</h3>
                <p className="text-[0.85rem] text-slate-500 mt-1 text-center">Share it anywhere on the internet.</p>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col gap-3 mb-6">
                  <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 pl-4">
                    <span className="truncate text-[0.9rem] font-semibold text-[#2B0094]">{createdData.shortUrl}</span>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(createdData.shortUrl)
                        toast.success('Copied to clipboard!')
                      }}
                      size="icon"
                      className="shrink-0 size-8 rounded-lg bg-slate-900 hover:bg-slate-800"
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                {createdData.hasQr && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-center text-[0.75rem] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Scan QR Code
                    </h3>
                    <div className="flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-inner shadow-slate-100/50">
                      <div className="rounded-[1rem] bg-white p-3 shadow-sm border border-slate-100">
                        <QRCode
                          value={createdData.shortUrl}
                          size={120}
                          fgColor="#0F172A"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <Link href="/link" className="block w-full">
                    <Button className="w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900">
                      <ExternalLink className="mr-2 size-4" /> View all links
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            // --- LIVE PREVIEW SIDEBAR ---
            <>
              <div className="border-b border-slate-100 bg-slate-50/50 p-6">
                <h3 className="flex items-center gap-2 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                  <Globe className="size-4" /> Live Preview
                </h3>
              </div>
              
              <div className="p-6">
                <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center shadow-inner shadow-slate-100/50">
                  <div className="inline-flex items-center gap-0.5 text-[1rem] font-medium break-all">
                    <span className="text-slate-400">{baseUrl.replace(/^https?:\/\//, '')}/</span>
                    <span className="font-bold text-[#2B0094]">{alias || 'xxxxxx'}</span>
                  </div>
                </div>

                {qrCode && (
                  <div>
                    <h3 className="mb-4 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-slate-400">
                      QR Preview
                    </h3>
                    <div className="mb-8 flex justify-center rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-inner shadow-slate-100/50">
                      <div className="rounded-[1rem] bg-white p-3 shadow-sm border border-slate-100">
                        <QRCode
                          value={`${baseUrl}/${alias || 'preview'}`}
                          size={112}
                          fgColor="#0F172A"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                <h3 className="mb-4 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Estimated Features
                </h3>
                <ul className="space-y-3.5 text-[0.95rem] font-medium text-slate-600">
                  {qrCode && (
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4.5 text-green-500" strokeWidth={2.5} />
                      QR Code
                    </li>
                  )}
                  {expires && (
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4.5 text-green-500" strokeWidth={2.5} />
                      Expires on date
                    </li>
                  )}
                  <li className="flex items-center gap-3 text-slate-400">
                    <Star className="size-4.5 text-slate-300" strokeWidth={2.5} />
                    Click Analytics (Pro)
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
