'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Info, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExpirySelector } from '@/components/home/expiry-selector'
import { type ExpiryDuration } from '@/lib/validators'
import { getLinkDetailAction } from '@/app/actions/links.analytics'
import { createLinkAction } from '@/app/actions/links'
import type { LinkDetailData } from '@/app/actions/links.analytics'

export default function EditLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [linkId, setLinkId] = useState<string | null>(null)
  const [link, setLink] = useState<LinkDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Slug
  const [slug, setSlug] = useState('')
  const [slugError, setSlugError] = useState('')

  // Expiry
  const [expiresIn, setExpiresIn] = useState<ExpiryDuration>(null)
  const [customValue, setCustomValue] = useState('')
  const [customUnit, setCustomUnit] = useState<'m' | 'h'>('m')

  // Warning banner
  const [showWarning, setShowWarning] = useState(true)

  useEffect(() => {
    params.then((p) => setLinkId(p.id))
  }, [params])

  // Load link detail
  useEffect(() => {
    if (!linkId) return
    let cancelled = false

    getLinkDetailAction(linkId).then((result) => {
      if (cancelled) return
      if (!result.success) {
        toast.error(result.error)
        router.push('/link')
        return
      }
      const data = result.data
      setLink(data)
      setSlug(data.slug)

      // Pre-set expiry from existing link
      if (data.expiresAt) {
        const daysLeft = Math.ceil(
          (new Date(data.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        if (daysLeft <= 1) setExpiresIn('1d')
        else if (daysLeft <= 7) setExpiresIn('7d')
        else if (daysLeft <= 30) setExpiresIn('30d')
        else if (daysLeft <= 90) setExpiresIn('90d')
        else setExpiresIn(null)
      } else {
        setExpiresIn(null)
      }

      setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [linkId, router])

  const validateSlug = useCallback((value: string): boolean => {
    setSlugError('')
    if (!value) {
      setSlugError('Alias is required')
      return false
    }
    if (value.length < 3) {
      setSlugError('At least 3 characters')
      return false
    }
    if (value.length > 50) {
      setSlugError('Maximum 50 characters')
      return false
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value)) {
      setSlugError('Letters, numbers, and hyphens only')
      return false
    }
    return true
  }, [])

  const handleSave = useCallback(async () => {
    if (!link) return

    if (!validateSlug(slug)) return

    setIsSaving(true)
    try {
      const result = await createLinkAction({
        url: link.originalUrl,
        alias: slug,
        expiresIn: (() => {
          if (expiresIn === 'custom' && customValue) {
            const num = parseInt(customValue, 10)
            if (customUnit === 'h') return `${num}h` as ExpiryDuration
            return `${num}m` as ExpiryDuration
          }
          return expiresIn
        })(),
      })

      if (result.success) {
        toast.success('New short link created! The original link remains active.')
        router.push('/link')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }, [link, slug, validateSlug, router, expiresIn, customValue, customUnit])

  if (isLoading) {
    return (
      <div className="global-content bg-white mt-12 pb-10 pt-8">
        <div className="animate-pulse space-y-6 pt-10">
          {/* Title */}
          <div className="h-8 w-32 rounded bg-slate-200" />

          {/* Warning banner */}
          <div className="h-20 rounded-lg bg-slate-200" />

          {/* Short link section */}
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-6 w-48 rounded bg-slate-200" />
          </div>

          {/* Destination URL section */}
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-6 w-64 rounded bg-slate-200" />
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-slate-200" />

          {/* Optional details */}
          <div className="space-y-4">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-12 rounded bg-slate-200" />
                <div className="h-12 rounded-none bg-slate-200" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-12 rounded-none bg-slate-200" />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3">
            <div className="h-12 w-24 rounded-none bg-slate-200" />
            <div className="h-12 w-24 rounded-none bg-slate-200" />
          </div>
        </div>
      </div>
    )
  }

  if (!link) {
    return (
      <div className="global-content bg-white pt-10 text-sm text-red-600">
        Link not found
      </div>
    )
  }

  return (
    <div className="global-content bg-white mt-12 pb-10 pt-8">
      {/* Header */}
      <h1 className="text-[28px] font-bold text-slate-900 mb-8">Edit link</h1>

      {/* Warning banner */}
      {showWarning && (
        <div className="relative mb-8 flex gap-3 rounded-lg bg-[#F1ECFB] p-4">
          <Info className="size-5 shrink-0 text-[#6B4FBB] mt-0.5" />
          <p className="text-sm text-[#4B3D72] leading-relaxed pr-8">
            Editing your short link will create a <strong>new, separate</strong> short link.
            The current short link <strong>will remain active</strong> and continue to point to the same destination.{' '}
            {/* <button
              onClick={() => {}}
              className="underline underline-offset-2 font-medium hover:text-[#3D2B6B] transition-colors"
            >
              Learn more
            </button> */}
          </p>
          <button
            onClick={() => setShowWarning(false)}
            className="absolute top-3 right-3 rounded p-1 text-[#6B4FBB] hover:bg-[#E5DCF7] transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Short link section */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Short link</h2>
        <span className="text-base font-medium text-slate-900">/{link.slug}</span>
      </div>

      {/* Destination URL section */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Destination URL</h2>
        <div className="flex items-center gap-3">
          <span className="text-base text-slate-900 truncate flex-1">{link.originalUrl}</span>
          <button
            onClick={() => window.open(link.originalUrl, '_blank', 'noopener,noreferrer')}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-500 transition-colors shrink-0"
            title="Open destination in new tab"
          >
            <ExternalLink className="size-3.5" />
            Redirect
          </button>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-slate-200 my-8" />

      {/* Optional details */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Optional details</h2>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Slug */}
          <div className="flex-1">
            <Label className="block text-sm font-medium text-slate-700 mb-1.5">
              Slug
            </Label>
            <Input
              value={slug}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                setSlug(val)
                if (slugError) validateSlug(val)
              }}
              className="h-12 rounded-none border-slate-200"
            />
            {slugError && (
              <p className="text-xs text-red-600 mt-1">{slugError}</p>
            )}
          </div>

          {/* Expires in */}
          <div className="flex-1">
            <ExpirySelector
              value={expiresIn}
              onChange={setExpiresIn}
              customValue={customValue}
              customUnit={customUnit}
              onCustomValueChange={setCustomValue}
              onCustomUnitChange={setCustomUnit}
              label="Expires After"
            />
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-10 flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/link')}
          disabled={isSaving}
          className="h-12 px-8 text-[0.95rem] font-medium border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !slug}
          className="h-12 px-8 text-[0.95rem] font-medium bg-brand hover:bg-brand-500 text-white"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
