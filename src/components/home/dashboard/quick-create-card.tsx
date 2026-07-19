'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, Copy, CheckCheck, Loader2, Zap, QrCode, Download } from 'lucide-react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import { createLinkAction } from '@/app/actions/links'

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuickCreateCardProps {
  isLinkLimitReached: boolean
  isQrLimitReached: boolean
  /** null means pro (unlimited) — show nothing */
  linksRemainingThisMonth: number | null
  /** null means pro (unlimited) — show nothing */
  qrCodesRemainingThisMonth: number | null
}

// ─── Result type ──────────────────────────────────────────────────────────────

interface CreatedResult {
  shortUrl: string
  hasQr: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickCreateCard({
  isLinkLimitReached,
  isQrLimitReached,
  linksRemainingThisMonth,
  qrCodesRemainingThisMonth,
}: QuickCreateCardProps) {
  const [url, setUrl] = useState('')
  const [qrCode, setQrCode] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [created, setCreated] = useState<CreatedResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBaseUrl(process.env.NEXT_PUBLIC_BASE_URL || window.location.origin)
  }, [])

  // If QR limit is reached, uncheck silently when the prop updates
  useEffect(() => {
    if (isQrLimitReached) setQrCode(false)
  }, [isQrLimitReached])

  function validateUrl(value: string): string | null {
    if (!value.trim()) return 'Please enter a URL'
    try {
      const parsed = new URL(value)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'URL must start with http:// or https://'
      }
      return null
    } catch {
      return 'Must be a valid URL (e.g. https://example.com)'
    }
  }

  function handleShorten() {
    const err = validateUrl(url)
    if (err) {
      setUrlError(err)
      return
    }
    setUrlError(null)

    // Capture whether QR was requested before the async action clears state
    const requestedQr = qrCode

    startTransition(async () => {
      const res = await createLinkAction({ url, qrCode: requestedQr })
      if (res.success && res.data) {
        const short = `${baseUrl}/${res.data.slug}`
        setCreated({ shortUrl: short, hasQr: requestedQr })
        setUrl('')
        setQrCode(false)
        toast.success(requestedQr ? 'Link & QR code created!' : 'Link shortened!')
      } else {
        toast.error((res as { error: string }).error || 'Failed to shorten link')
      }
    })
  }

  function handleCopy() {
    if (!created) return
    navigator.clipboard.writeText(created.shortUrl)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleShorten()
  }

  // ── QR download ─────────────────────────────────────────────────────────────
  // react-qr-code renders an <svg>. We serialize it to a PNG via canvas for download.
  const handleDownloadQr = useCallback(() => {
    const svgEl = qrRef.current?.querySelector('svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    const size = 512
    canvas.width = size
    canvas.height = size

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      // White background
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (!blob) return
        const dlUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const slug = created?.shortUrl.split('/').pop() ?? 'qr'
        a.href = dlUrl
        a.download = `qr-${slug}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(dlUrl)
        toast.success('QR code downloaded!')
      }, 'image/png')
    }

    img.src = url
  }, [created])

  // Whether to show free-tier quota text (null = pro = skip)
  const showLinkQuota = linksRemainingThisMonth !== null
  const showQrQuota = qrCode && qrCodesRemainingThisMonth !== null

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* ── Card header: right-aligned link quota for free users ── */}
      {showLinkQuota && (
        <div className="mb-3 flex items-center justify-end">
          <p
            id="quick-create-link-quota"
            className={`text-[0.78rem] font-medium ${
              isLinkLimitReached ? 'text-red-500' : 'text-slate-400'
            }`}
          >
            {isLinkLimitReached
              ? 'Monthly link limit reached'
              : `You can create ${linksRemainingThisMonth} more link${linksRemainingThisMonth === 1 ? '' : 's'} this month.`}
          </p>
        </div>
      )}

      {/* ── URL input + Shorten button ── */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            id="quick-create-url"
            type="url"
            placeholder="Paste a long URL to shorten it"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError(null)
              setCreated(null)
            }}
            onKeyDown={handleKeyDown}
            disabled={isLinkLimitReached || isPending}
            className={`h-11 w-full rounded-xl border bg-white px-4 text-[0.95rem] text-slate-900 placeholder:text-slate-400 shadow-sm transition-all focus:outline-none focus:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed ${
              urlError
                ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15'
                : 'border-slate-200 hover:border-slate-300 focus:border-[#2B0094] focus:ring-[#2B0094]/15'
            }`}
          />
        </div>
        <button
          id="quick-create-submit"
          onClick={handleShorten}
          disabled={isLinkLimitReached || isPending}
          className="flex h-11 items-center gap-2 rounded-xl border border-[#23007A] bg-gradient-to-b from-[#3D00D1] to-[#2B0094] px-5 text-[0.95rem] font-semibold text-white shadow-[0_2px_5px_rgba(43,0,148,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:from-[#4300E6] hover:to-[#3100A8] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Zap className="size-4" />
          )}
          Shorten
        </button>
      </div>

      {/* ── Validation error ── */}
      {urlError && (
        <p className="mt-2 text-[0.8rem] font-medium text-red-500">{urlError}</p>
      )}

      {/* ── QR checkbox row ── */}
      <div className="mt-3">
        {isQrLimitReached ? (
          <p id="quick-create-qr-limit" className="flex items-center gap-1.5 text-[0.8rem] text-slate-400">
            <QrCode className="size-3.5 shrink-0" />
            QR limit reached —{' '}
            <Link
              href="/billing/upgrade"
              className="font-semibold text-[#2B0094] underline-offset-2 hover:underline"
            >
              Upgrade to Pro
            </Link>
          </p>
        ) : (
          <label
            id="quick-create-qr-label"
            className={`inline-flex cursor-pointer items-center gap-2.5 ${
              isLinkLimitReached ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            <input
              id="quick-create-qr-checkbox"
              type="checkbox"
              checked={qrCode}
              onChange={(e) => setQrCode(e.target.checked)}
              disabled={isLinkLimitReached || isPending}
              className="size-4 rounded border-slate-300 accent-[#2B0094] disabled:cursor-not-allowed"
            />
            <span className="flex items-center gap-1.5 text-[0.85rem] font-medium text-slate-700">
              <QrCode className="size-3.5 text-slate-500" />
              Also create a QR code
            </span>

            {/* Inline QR remaining count — only when checked and free user */}
            {showQrQuota && (
              <span
                id="quick-create-qr-remaining"
                className="text-[0.75rem] text-slate-400"
              >
                ({qrCodesRemainingThisMonth} QR code{qrCodesRemainingThisMonth === 1 ? '' : 's'} left this month)
              </span>
            )}
          </label>
        )}
      </div>

      {/* ── Link limit message ── */}
      {isLinkLimitReached && (
        <p className="mt-2 text-[0.82rem] font-medium text-amber-600">
          You&apos;ve reached your monthly link limit.{' '}
          <Link href="/billing/upgrade" className="underline hover:text-amber-700">
            Upgrade to Pro
          </Link>{' '}
          for unlimited links.
        </p>
      )}

      {/* ── Success state ── */}
      {created && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Short URL + Copy */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2B0094]/20 bg-[#ECEEFE] px-4 py-2.5">
            <span className="truncate font-mono text-[0.9rem] font-semibold text-[#2B0094]">
              {created.shortUrl}
            </span>
            <button
              onClick={handleCopy}
              title="Copy"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#2B0094] px-3 py-1.5 text-[0.78rem] font-semibold text-white transition-all hover:bg-[#1f006b]"
            >
              {copied ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* QR code — shown when hasQr is true */}
          {created.hasQr && (
            <div className="mt-3 flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {/* QR thumbnail */}
              <div
                ref={qrRef}
                id="quick-create-qr-preview"
                className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
              >
                <QRCode
                  value={created.shortUrl}
                  size={96}
                  fgColor="#0F172A"
                />
              </div>

              {/* Label + download */}
              <div className="flex flex-col justify-between gap-3 py-1">
                <div>
                  <p className="text-[0.82rem] font-semibold text-slate-700">QR code ready</p>
                  <p className="mt-0.5 text-[0.75rem] text-slate-400">
                    Scan to open{' '}
                    <span className="font-mono font-medium">
                      {created.shortUrl.replace(/^https?:\/\//, '')}
                    </span>
                  </p>
                </div>
                <button
                  id="quick-create-qr-download"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  <Download className="size-3.5" />
                  Download PNG
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Advanced create link ── */}
      {!isLinkLimitReached && (
        <p className="mt-3 text-[0.82rem] text-slate-500">
          Need a custom alias or expiration?{' '}
          <Link
            href="/links/new"
            className="inline-flex items-center gap-0.5 font-semibold text-[#2B0094] underline-offset-2 hover:underline"
          >
            Open advanced create
            <ArrowRight className="size-3" />
          </Link>
        </p>
      )}
    </div>
  )
}
