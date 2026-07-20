'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { getUserUsageStatsAction, createLinkAction, checkAliasAvailabilityAction } from '@/app/actions/links'
import { type ExpiryDuration } from '@/lib/validators'
import { toast } from 'sonner'

const ENV_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ''

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkStats {
  linkCount: number
  qrCount: number
  isPro: boolean
  limits: { links: number; qr: number }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCreateLink() {
  // Form state
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [qrCode, setQrCode] = useState(false)
  const [expires, setExpires] = useState(false)
  const [expiresIn, setExpiresIn] = useState<ExpiryDuration>(null)
  const [customValue, setCustomValue] = useState('')
  const [customUnit, setCustomUnit] = useState<'m' | 'h'>('m')

  // UI state
  const [stats, setStats] = useState<LinkStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [createdData, setCreatedData] = useState<{ shortUrl: string; originalUrl: string; hasQr: boolean } | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [aliasStatus, setAliasStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [aliasError, setAliasError] = useState<string | null>(null)
  const hasMountedStats = useRef(false)
  const hasMountedBaseUrl = useRef(false)
  const [baseUrl, setBaseUrl] = useState(ENV_BASE_URL)

  // Resolve baseUrl after mount (SSR-safe)
  useEffect(() => {
    if (hasMountedBaseUrl.current) return
    hasMountedBaseUrl.current = true
    if (!ENV_BASE_URL) {
      Promise.resolve().then(() => setBaseUrl(window.location.origin))
    }
  }, [])

  // ─── Data fetching ────────────────────────────────────────────────────────

  async function loadStats() {
    const res = await getUserUsageStatsAction()
    if (res.success && res.data) {
      setStats(res.data)
      if (!res.data.isPro && res.data.qrCount >= res.data.limits.qr) {
        setQrCode(false)
      }
    }
    setLoadingStats(false)
  }

  useEffect(() => {
    if (hasMountedStats.current) return
    hasMountedStats.current = true
    loadStats()
  }, [])

  // ─── Validation ──────────────────────────────────────────────────────────

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

  // ─── Alias availability ───────────────────────────────────────────────────

  async function checkAlias(value: string) {
    if (!value.trim()) {
      setAliasStatus('idle')
      setAliasError(null)
      return
    }
    setAliasStatus('checking')
    setAliasError(null)
    const result = await checkAliasAvailabilityAction(value)
    if (result.available) {
      setAliasStatus('available')
    } else {
      setAliasStatus('taken')
      setAliasError(result.reason || 'Alias not available')
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function getExpiryLabel(value: ExpiryDuration): string {
    if (value === null) return 'No expiry'
    if (typeof value === 'number') return `${value} minute${value > 1 ? 's' : ''}`
    if (value === 'custom') {
      if (!customValue) return 'No expiry'
      return customUnit === 'h'
        ? `${customValue} hour${Number(customValue) > 1 ? 's' : ''}`
        : `${customValue} minute${Number(customValue) > 1 ? 's' : ''}`
    }
    const match = value.match(/^(\d+)(m|h|d|w|mo)$/)
    if (!match) return 'No expiry'
    const num = Number(match[1])
    const unit = match[2]
    switch (unit) {
      case 'm': return `${num} minute${num > 1 ? 's' : ''}`
      case 'h': return `${num} hour${num > 1 ? 's' : ''}`
      case 'd': return `${num} day${num > 1 ? 's' : ''}`
      case 'w': return `${num} week${num > 1 ? 's' : ''}`
      case 'mo': return `${num} month${num > 1 ? 's' : ''}`
      default: return 'No expiry'
    }
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function handleCreate() {
    const err = validateUrl(url)
    if (err) {
      setUrlError(err)
      return
    }

    const resolvedExpiresIn = expires
      ? expiresIn === 'custom'
        ? customValue
          ? customUnit === 'm'
            ? Number(customValue)
            : Number(customValue) * 60
          : null
        : expiresIn
      : null

    startTransition(async () => {
      const res = await createLinkAction({
        url,
        alias: alias || undefined,
        qrCode,
        expiresIn: resolvedExpiresIn,
      })

      if (res.success && res.data) {
        toast.success('Link created successfully!')
        setCreatedData({
          shortUrl: `${baseUrl}/${res.data.slug}`,
          originalUrl: url,
          hasQr: qrCode,
        })
        setUrl('')
        setAlias('')
        setExpiresIn(null)
        setCustomValue('')
        setExpires(false)
        setQrCode(false)
        await loadStats()
      } else {
        toast.error(res.error || 'Failed to create link')
      }
    })
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const isPro = stats?.isPro ?? false
  const isLinkLimitReached = !!(stats && !stats.isPro && stats.linkCount >= stats.limits.links)
  const isQrLimitReached = !!(stats && !stats.isPro && stats.qrCount >= stats.limits.qr)

  return {
    // State
    url, setUrl,
    alias, setAlias,
    qrCode, setQrCode,
    expires, setExpires,
    expiresIn, setExpiresIn,
    customValue, setCustomValue,
    customUnit, setCustomUnit,
    stats, loadingStats,
    isPending, startTransition,
    createdData,
    urlError, setUrlError,
    aliasStatus, setAliasStatus,
    aliasError, setAliasError,
    baseUrl,
    // Actions
    handleCreate,
    checkAlias,
    getExpiryLabel,
    validateUrl,
    // Computed
    isPro,
    isLinkLimitReached,
    isQrLimitReached,
  }
}
