'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Info, X, ExternalLink, Pencil } from 'lucide-react'
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
      <div className="global-content mb-12 mt-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-sm md:p-10">
            {/* Header */}
            <div className="mb-10 flex items-start gap-5">
              <div className="size-12 rounded-xl skeleton shrink-0" />
              <div className="space-y-2">
                <div className="h-8 w-48 rounded skeleton" />
                <div className="h-4 w-64 rounded skeleton" />
              </div>
            </div>

            <div className="space-y-8">
              {/* Warning banner */}
              <div className="h-24 w-full rounded-xl skeleton" />
              
              {/* Fields */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="h-5 w-24 rounded skeleton" />
                  <div className="h-11 w-full rounded-xl skeleton" />
                </div>
                <div className="space-y-4">
                  <div className="h-5 w-32 rounded skeleton" />
                  <div className="h-11 w-full rounded-xl skeleton" />
                </div>
              </div>
              
              <div className="my-8 h-px w-full bg-border/50" />

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="h-5 w-20 rounded skeleton" />
                  <div className="h-12 w-full rounded-xl skeleton" />
                </div>
                <div className="space-y-4">
                  <div className="h-5 w-32 rounded skeleton" />
                  <div className="h-12 w-full rounded-xl skeleton" />
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-3 pt-4 border-t border-border/40">
                <div className="h-11 w-24 rounded-xl skeleton" />
                <div className="h-11 w-32 rounded-xl skeleton" />
              </div>
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
    <div className="global-content mb-12 mt-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-sm md:p-10">
          
          {/* Header */}
          <div className="mb-10 flex items-start gap-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50 text-[var(--accent-brand)] shadow-sm">
              <Pencil className="size-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Edit Short Link
              </h1>
              <p className="mt-1.5 text-base font-medium text-muted-foreground">
                Modify your existing link details and expiration.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Warning banner */}
            {showWarning && (
              <div className="relative flex gap-3 rounded-xl border border-[var(--accent-brand)]/20 bg-[var(--accent-brand-subtle)] p-5 dark:bg-[var(--accent-brand)]/10">
                <Info className="size-5 shrink-0 text-[var(--accent-brand)] mt-0.5" />
                <p className="text-[0.95rem] text-foreground leading-relaxed pr-8">
                  Editing your short link will create a <strong>new, separate</strong> short link.
                  The current short link <strong>will remain active</strong> and continue to point to the same destination.
                </p>
                <button
                  onClick={() => setShowWarning(false)}
                  className="absolute top-4 right-4 rounded-md p-1.5 text-[var(--accent-brand)] hover:bg-[var(--accent-brand)]/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {/* Short link section */}
              <div>
                <h2 className="text-[0.95rem] font-semibold text-foreground mb-2">Current Short Link</h2>
                <span className="flex items-center h-11 px-4 rounded-xl bg-muted/50 text-[0.95rem] font-medium text-foreground border border-border/50 w-full">
                  /{link.slug}
                </span>
              </div>

              {/* Destination URL section */}
              <div>
                <h2 className="text-[0.95rem] font-semibold text-foreground mb-2">Destination URL</h2>
                <div className="flex items-center gap-3 h-11 px-4 rounded-xl border border-border/50 bg-muted/50">
                  <span className="text-[0.95rem] text-muted-foreground truncate flex-1">{link.originalUrl}</span>
                  <button
                    onClick={() => window.open(link.originalUrl, '_blank', 'noopener,noreferrer')}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-brand)] hover:text-[var(--accent-brand-hover)] transition-colors shrink-0"
                    title="Open destination in new tab"
                  >
                    <ExternalLink className="size-3.5" />
                    Visit
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-border/60 my-8" />

            {/* Optional details */}
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground mb-6">Optional details</h2>
              <div className="grid gap-8 sm:grid-cols-2">
                {/* Slug */}
                <div className="space-y-2">
                  <Label className="text-[0.95rem] font-semibold text-foreground flex items-center gap-2">
                    Custom Slug
                  </Label>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      setSlug(val)
                      if (slugError) validateSlug(val)
                    }}
                    className="h-12 rounded-xl border-border/80 bg-background shadow-sm focus-visible:ring-[var(--accent-brand)]"
                    placeholder="e.g. summer-sale"
                  />
                  {slugError && (
                    <p className="text-xs font-medium text-red-500 mt-1.5">{slugError}</p>
                  )}
                </div>

                {/* Expires in */}
                <div className="space-y-2">
                  <ExpirySelector
                    value={expiresIn}
                    onChange={setExpiresIn}
                    customValue={customValue}
                    customUnit={customUnit}
                    onCustomValueChange={setCustomValue}
                    onCustomUnitChange={setCustomUnit}
                    label="Expiration"
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-10 flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => router.push('/link')}
                disabled={isSaving}
                className="h-11 px-6 rounded-xl text-[0.95rem] font-semibold border-border/80 hover:bg-muted/80 shadow-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !slug}
                className="h-11 px-8 rounded-xl text-[0.95rem] font-semibold bg-[var(--accent-brand)] hover:bg-[var(--accent-brand-hover)] text-white shadow-md shadow-[var(--accent-brand)]/20 transition-all hover:shadow-lg active:scale-[0.97]"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
