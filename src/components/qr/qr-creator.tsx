'use client'

import { useState, useEffect } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Loader2, Link2, Palette, Save, ArrowLeft, Grid, CircleDot, Plus, Check, Lock, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUserLinksAction, checkAliasAvailabilityAction } from '@/app/actions/links.read'
import { createQrCode, getQrCodes } from '@/app/actions/qr'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QrCreatorProps {
  appUrl: string
  isPro?: boolean
}

const PRESET_COLORS = [
  '#000000', '#1F2937', '#3D52A0', '#4F46E5', '#7C3AED', '#DB2777', '#E11D48', '#059669', '#0284C7'
]

type CreateMode = 'existing' | 'new'

export function QrCreator({ appUrl, isPro = false }: QrCreatorProps) {
  const [links, setLinks] = useState<Array<{ id: string; slug: string; originalUrl: string }>>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const [mode, setMode] = useState<CreateMode>('new')
  const [linkId, setLinkId] = useState('')
  const [rawUrl, setRawUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [aliasChecking, setAliasChecking] = useState(false)
  const [aliasError, setAliasError] = useState('')
  
  const [showUtms, setShowUtms] = useState(false)
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [style, setStyle] = useState<'squares' | 'dots'>('squares')
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false)

  useEffect(() => {
    Promise.all([getUserLinksAction(), getQrCodes()]).then(([linksRes, qrRes]) => {
      if (linksRes.success && qrRes.success) {
        const existingLinkIds = new Set(qrRes.data!.map(q => q.linkId).filter(Boolean))
        const availableLinks = linksRes.data.filter(l => !existingLinkIds.has(l.id))
        setLinks(availableLinks)
        if (availableLinks.length > 0) setLinkId(availableLinks[0].id)
      }
      setLoadingLinks(false)
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!alias.trim()) {
        setAliasError('')
        return
      }
      setAliasChecking(true)
      const res = await checkAliasAvailabilityAction(alias)
      setAliasChecking(false)
      if (!res.available) {
        setAliasError(res.reason || 'Not available')
      } else {
        setAliasError('')
      }
    }, alias.trim() ? 500 : 0)
    return () => clearTimeout(timer)
  }, [alias])

  const selectedLink = links.find((l) => l.id === linkId)
  
  let previewUrl = 'https://link-vault-theta.vercel.app'
  if (mode === 'existing' && selectedLink) {
    previewUrl = `${appUrl}/${selectedLink.slug}`
  } else if (mode === 'new' && rawUrl) {
    previewUrl = rawUrl
  }

  const handleCreate = async () => {
    if (mode === 'existing' && !linkId) return toast.error('Please select an existing link')
    if (mode === 'new' && !rawUrl) return toast.error('Please enter a valid URL')
    if (aliasError) return toast.error('Please fix the alias error')
    
    setIsSubmitting(true)

    const res = await createQrCode({ 
      mode, 
      linkId: mode === 'existing' ? linkId : undefined, 
      rawUrl: mode === 'new' ? rawUrl : undefined, 
      alias: mode === 'new' && isPro ? alias : undefined,
      color: fgColor, 
      bgColor, 
      style,
      utmSource: mode === 'new' && showUtms && isPro ? utmSource : undefined,
      utmMedium: mode === 'new' && showUtms && isPro ? utmMedium : undefined,
      utmCampaign: mode === 'new' && showUtms && isPro ? utmCampaign : undefined,
    })
    
    if (res.success) {
      toast.success('QR Code created!')
      router.push('/qr')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to create QR code')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/qr"
        className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
      >
        <div className="flex size-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 transition-all group-hover:ring-slate-300 dark:bg-card dark:ring-border">
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        </div>
        Back to QR Codes
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground">Create QR Code</h1>
        <p className="text-sm text-slate-500 dark:text-muted-foreground">Design a custom QR code in multiple formats.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        
        {/* Left: Configuration Form */}
        <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8 lg:col-span-3">
          
          {/* Mode Selector */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Select QR Type
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100/50 p-1.5 dark:bg-muted/50">
              <button
                onClick={() => setMode('new')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${mode === 'new' ? 'bg-white text-slate-900 shadow-sm dark:bg-card dark:text-foreground ring-1 ring-slate-200 dark:ring-border' : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground'}`}
              >
                <Plus className="size-4" />
                <span>New Link</span>
              </button>

              <button
                onClick={() => setMode('existing')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${mode === 'existing' ? 'bg-white text-slate-900 shadow-sm dark:bg-card dark:text-foreground ring-1 ring-slate-200 dark:ring-border' : 'text-slate-500 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground'}`}
              >
                <Link2 className="size-4" />
                <span>Existing Link</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-border" />

          {/* Destination Input */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {mode === 'existing' ? 'Select your link' : 'Destination URL'}
            </label>
            
            {mode === 'existing' ? (
              loadingLinks ? (
                <div className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-border dark:bg-muted/50">
                  <Loader2 className="size-4 animate-spin text-slate-400" />
                </div>
              ) : links.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                  All your links already have QR codes! Create a new link to continue.
                </div>
              ) : (
                <select
                  value={linkId}
                  onChange={(e) => setLinkId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background"
                >
                  {links.map((link) => (
                    <option key={link.id} value={link.id}>
                      /{link.slug} — {link.originalUrl.substring(0, 40)}{link.originalUrl.length > 40 ? '...' : ''}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <div className="space-y-4">
                <input 
                  type="url"
                  value={rawUrl}
                  onChange={(e) => setRawUrl(e.target.value)}
                  placeholder="Original URL (e.g., https://example.com)"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background"
                />
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Custom Alias</label>
                    {!isPro && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase">
                        <Lock className="size-3" /> Pro Feature
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-sm text-slate-400">link-vault-theta.vercel.app/</span>
                    </div>
                    <input
                      type="text"
                      disabled={!isPro}
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder={isPro ? "custom-name" : "Upgrade to unlock"}
                      className={`h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-28 pr-10 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background dark:focus:bg-background ${!isPro ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                    {aliasChecking && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <Loader2 className="size-4 animate-spin text-slate-400" />
                      </div>
                    )}
                  </div>
                  {aliasError && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">{aliasError}</p>
                  )}
                  {alias && !aliasError && !aliasChecking && (
                    <p className="mt-1.5 text-xs font-medium text-emerald-500">Available!</p>
                  )}
                </div>

                {/* UTM Tags */}
                <div className={`mt-2 rounded-xl border transition-all duration-200 ${showUtms && isPro ? 'border-[#2B0094]/30 bg-[#2B0094]/2' : 'border-slate-200 bg-white dark:border-border dark:bg-card'}`}>
                  <label className={`flex cursor-pointer items-center justify-between p-4 transition-all ${showUtms && isPro ? '' : 'hover:-translate-y-px hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600'}`}>
                    <div className="flex items-center gap-3.5">
                      <div className="relative flex size-4.5 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isPro ? showUtms : false}
                          onChange={(e) => {
                            if (isPro) {
                              setShowUtms(e.target.checked)
                              if (!e.target.checked) {
                                setUtmSource('')
                                setUtmMedium('')
                                setUtmCampaign('')
                              }
                            }
                          }}
                          disabled={!isPro}
                          className="peer size-4.5 rounded border-slate-300 text-[#2B0094] focus:ring-[#2B0094]/20 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-background"
                        />
                      </div>
                      <span className="flex items-center gap-2 text-[0.95rem] font-medium text-slate-800 dark:text-slate-200">
                        <Tag className="size-4 text-[#2B0094]" />
                        UTM Tags
                      </span>
                    </div>
                    {!isPro ? (
                      <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-slate-500 dark:text-muted-foreground">
                        Upgrade to Pro
                      </span>
                    ) : (
                      showUtms && (utmSource || utmMedium || utmCampaign) && (
                        <span className="rounded-md bg-[#2B0094]/10 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-[#2B0094] dark:bg-[#2B0094]/20">
                          Configured
                        </span>
                      )
                    )}
                  </label>

                  {showUtms && isPro && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <div className="mx-4 mb-4 h-px bg-[#2B0094]/10 dark:bg-[#2B0094]/20" />
                      <div className="px-4 pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <div className="flex-1 space-y-1">
                            <label className="text-[0.75rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Source</label>
                            <input
                              type="text"
                              placeholder="e.g. twitter"
                              value={utmSource}
                              onChange={(e) => setUtmSource(e.target.value)}
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[0.9rem] font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-[#2B0094] focus:outline-none focus:ring-[3px] focus:ring-[#2B0094]/15 dark:border-border dark:bg-background dark:text-foreground dark:hover:border-slate-600"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[0.75rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Medium</label>
                            <input
                              type="text"
                              placeholder="e.g. social"
                              value={utmMedium}
                              onChange={(e) => setUtmMedium(e.target.value)}
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[0.9rem] font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-[#2B0094] focus:outline-none focus:ring-[3px] focus:ring-[#2B0094]/15 dark:border-border dark:bg-background dark:text-foreground dark:hover:border-slate-600"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[0.75rem] font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Campaign</label>
                            <input
                              type="text"
                              placeholder="e.g. summer_sale"
                              value={utmCampaign}
                              onChange={(e) => setUtmCampaign(e.target.value)}
                              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[0.9rem] font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-[#2B0094] focus:outline-none focus:ring-[3px] focus:ring-[#2B0094]/15 dark:border-border dark:bg-background dark:text-foreground dark:hover:border-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100 dark:border-border" />

          {/* Style Customization */}
          <div className="space-y-6">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Palette className="size-4 text-slate-400" />
              Customize Appearance
            </label>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-muted-foreground">Foreground Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="size-9 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={fgColor.toUpperCase()}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-muted-foreground">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="size-9 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={bgColor.toUpperCase()}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium uppercase focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-border dark:bg-background"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="mb-3 block text-xs font-medium text-slate-500 dark:text-muted-foreground">Pattern Style</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setStyle('squares')}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border transition-all ${style === 'squares' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-border dark:bg-card dark:text-muted-foreground'}`}
                >
                  <Grid className="size-4" />
                  <span className="text-sm font-medium">Squares</span>
                </button>
                <button
                  onClick={() => setStyle('dots')}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border transition-all ${style === 'dots' ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-400' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-border dark:bg-card dark:text-muted-foreground'}`}
                >
                  <CircleDot className="size-4" />
                  <span className="text-sm font-medium">Dots</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-2">
              <label className="mb-3 block text-xs font-medium text-slate-500 dark:text-muted-foreground">Quick Colors</label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFgColor(c)}
                    className={`flex size-8 items-center justify-center rounded-full border-2 transition-all ${fgColor.toLowerCase() === c.toLowerCase() ? 'border-brand-500 scale-110 shadow-sm' : 'border-transparent hover:scale-110 shadow-sm'}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {fgColor.toLowerCase() === c.toLowerCase() && <Check className="size-4 text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-6">
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || (mode === 'existing' && links.length === 0)}
              className="w-full gap-2 rounded-xl bg-brand-500 py-6 text-base hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-500"
            >
              {isSubmitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Save className="size-5" />
              )}
              {isSubmitting ? 'Saving...' : 'Save QR Code'}
            </Button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-8 flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 py-16 shadow-inner dark:border-border dark:bg-muted/30">
            <button
              onClick={() => setIsPreviewExpanded(true)}
              className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100 transition-all hover:scale-105 hover:shadow-2xl dark:bg-white dark:ring-0"
              title="Click to enlarge"
            >
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
              <QRCode
                value={previewUrl}
                size={220}
                fgColor={fgColor}
                bgColor={bgColor}
                qrStyle={style}
                eyeRadius={style === 'dots' ? 10 : 0}
              />
            </button>
            <p className="mt-8 rounded-full bg-slate-200/50 px-4 py-1.5 text-sm font-medium text-slate-500 dark:bg-muted dark:text-muted-foreground">Click to enlarge</p>
          </div>
        </div>
        
      </div>

      {/* Expanded Modal Lightbox */}
      {isPreviewExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-md transition-all animate-in fade-in duration-200"
          onClick={() => setIsPreviewExpanded(false)}
        >
          <div 
            className="rounded-[2.5rem] bg-white p-8 shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCode
              value={previewUrl}
              size={Math.min(480, typeof window !== 'undefined' ? window.innerWidth - 64 : 480)}
              fgColor={fgColor}
              bgColor={bgColor}
              qrStyle={style}
              eyeRadius={style === 'dots' ? 10 : 0}
            />
          </div>
        </div>
      )}
    </div>
  )
}
