'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, ExternalLink, Globe, Link2, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      <div className="global-content mb-12 mt-10">
        <div className="mx-auto max-w-5xl">
          {/* Header Skeleton */}
          <div className="mb-10 space-y-3">
            <div className="h-10 w-64 rounded-lg skeleton" />
            <div className="h-5 w-96 rounded-lg skeleton" />
          </div>

          <div className="space-y-8">
            {/* Box 1 Skeleton */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-sm w-full">
                  <div className="h-6 w-40 rounded skeleton" />
                  <div className="h-4 w-64 rounded skeleton" />
                </div>
                <div className="h-12 max-w-lg w-full rounded-xl skeleton" />
              </div>
            </div>

            {/* Box 2 Skeleton */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 max-w-sm w-full">
                  <div className="h-6 w-32 rounded skeleton" />
                  <div className="h-4 w-full rounded skeleton" />
                  <div className="h-4 w-4/5 rounded skeleton" />
                </div>
                <div className="max-w-lg w-full space-y-3">
                  <div className="h-12 w-full rounded-xl skeleton" />
                </div>
              </div>
              <div className="bg-muted/30 px-6 py-4 border-t border-border/60">
                <div className="h-4 w-48 rounded skeleton" />
              </div>
            </div>

            {/* Box 3 Skeleton */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 max-w-sm w-full">
                  <div className="h-6 w-32 rounded skeleton" />
                  <div className="h-4 w-56 rounded skeleton" />
                </div>
                <div className="h-12 max-w-lg w-full rounded-xl skeleton" />
              </div>
            </div>

            {/* Footer Skeleton */}
            <div className="mt-8 flex justify-end gap-4">
              <div className="h-11 w-24 rounded-xl skeleton" />
              <div className="h-11 w-36 rounded-xl skeleton" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!link) {
    return (
      <div className="global-content bg-card pt-10 text-sm text-red-600">
        Link not found
      </div>
    )
  }

  return (
    <div className="global-content mb-12 mt-10">
      <div className="mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Settings for <span className="text-[var(--accent-brand)]">/{link.slug}</span>
          </h1>
          <p className="mt-3 text-[1.05rem] text-muted-foreground">
            Manage routing, aliases, and expiration for this link.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Box 1: Current Destination */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md">
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-sm">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Globe className="size-4.5 text-[var(--accent-brand)]" />
                  Current Destination
                </h2>
                <p className="mt-1.5 text-[0.9rem] text-muted-foreground leading-relaxed">
                  The long URL this short link currently redirects to.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-muted/40 px-4 py-3.5 rounded-xl border border-border/50 max-w-lg w-full">
                <div className="flex-1 min-w-0">
                  <span className="text-[0.95rem] font-medium text-foreground truncate block">{link.originalUrl}</span>
                </div>
                <button
                  onClick={() => window.open(link.originalUrl, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent-brand)] hover:text-[var(--accent-brand-hover)] transition-colors shrink-0 bg-[var(--accent-brand)]/10 px-3 py-1.5 rounded-md"
                  title="Open destination in new tab"
                >
                  <ExternalLink className="size-3.5" />
                  Test
                </button>
              </div>
            </div>
          </div>

          {/* Box 2: Custom Slug (Alias) */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md border-l-4 border-l-[var(--accent-brand)]">
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="max-w-sm">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Link2 className="size-4.5 text-[var(--accent-brand)]" />
                  Re-route with Alias
                </h2>
                <p className="mt-1.5 text-[0.9rem] text-muted-foreground leading-relaxed">
                  Provide a new alias to re-route this destination. 
                  <span className="block mt-2 font-medium text-foreground">
                    Note: This will safely generate a new short link. Your existing <code className="bg-muted px-1.5 py-0.5 rounded text-[0.85rem]">/{link.slug}</code> link will remain fully active.
                  </span>
                </p>
              </div>
              <div className="max-w-lg w-full space-y-3">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-muted-foreground font-semibold select-none text-[0.95rem]">
                    /
                  </span>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      setSlug(val)
                      if (slugError) validateSlug(val)
                    }}
                    className="h-14 pl-8 rounded-xl border-border/80 bg-background font-semibold text-foreground text-[0.95rem] shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--accent-brand)] transition-all"
                    placeholder="e.g. summer-promo"
                  />
                </div>
                {slugError && (
                  <p className="text-[0.85rem] font-medium text-red-500 flex items-center gap-1.5">
                    <X className="size-3.5" /> {slugError}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-muted/30 px-6 py-3.5 border-t border-border/60 flex items-center justify-between">
              <p className="text-[0.85rem] font-medium text-muted-foreground">
                Only alphanumeric characters and hyphens are permitted.
              </p>
            </div>
          </div>

          {/* Box 3: Expiration */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md">
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="max-w-sm">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Clock className="size-4.5 text-[var(--accent-brand)]" />
                  Expiration
                </h2>
                <p className="mt-1.5 text-[0.9rem] text-muted-foreground leading-relaxed">
                  Set a strict time limit for the new link to remain active. Once expired, the link will redirect to a 404 page.
                </p>
              </div>
              <div className="max-w-lg w-full">
                <ExpirySelector
                  value={expiresIn}
                  onChange={setExpiresIn}
                  customValue={customValue}
                  customUnit={customUnit}
                  onCustomValueChange={setCustomValue}
                  onCustomUnitChange={setCustomUnit}
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-4 pt-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/link')}
              disabled={isSaving}
              className="h-12 px-6 rounded-xl text-[0.95rem] font-semibold hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !slug}
              className="h-12 px-8 rounded-xl text-[0.95rem] font-semibold bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] text-white shadow-md shadow-[var(--accent-brand)]/20 transition-all hover:shadow-lg active:scale-[0.97]"
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="size-4.5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
