'use client'

import { useRef, useState, useEffect } from 'react'
import { Link2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateLink } from '@/components/home/use-create-link'
import { UsageStats } from '@/components/home/usage-stats'
import { AliasInput } from '@/components/home/alias-input'
import { PreviewSidebar } from '@/components/home/preview-sidebar'
import { PRESET_DURATIONS, type ExpiryDuration } from '@/lib/validators'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Check, ChevronDown, Clock, Tag } from 'lucide-react'

export default function CreateLinkPage() {
  const {
    url, setUrl,
    alias, setAlias,
    qrCode, setQrCode,
    expires, setExpires,
    expiresIn, setExpiresIn,
    customValue, setCustomValue,
    customUnit, setCustomUnit,
    utmSource, setUtmSource,
    utmMedium, setUtmMedium,
    utmCampaign, setUtmCampaign,
    stats, loadingStats,
    isPending,
    createdData,
    urlError, setUrlError,
    aliasStatus, setAliasStatus,
    aliasError,
    baseUrl,
    handleCreate,
    checkAlias,
    getExpiryLabel,
    validateUrl,
    isPro,
    isLinkLimitReached,
    isQrLimitReached,
  } = useCreateLink()

  const aliasDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showUtms, setShowUtms] = useState(false)
  
  // Clean up UTM fields when toggle is turned off
  useEffect(() => {
    if (!showUtms) {
      setUtmSource('')
      setUtmMedium('')
      setUtmCampaign('')
    }
  }, [showUtms, setUtmSource, setUtmMedium, setUtmCampaign])

  function handleAliasChange(value: string) {
    setAlias(value)
    // Debounce the availability check to avoid hammering the server
    if (aliasDebounceRef.current) clearTimeout(aliasDebounceRef.current)
    aliasDebounceRef.current = setTimeout(() => {
      checkAlias(value)
    }, 400)
  }

  return (
    <div className="global-content mb-12 mt-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] lg:items-start">

        {/* ── Left Column: Form Card ── */}
        <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-sm md:p-10">
          {/* Header */}
          <div className="mb-10 flex items-start gap-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-linear-to-b from-slate-50 to-slate-100/50 text-[var(--accent-brand)] shadow-sm">
              <Link2 className="size-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Create Short Link
              </h1>
              <p className="mt-1.5 text-base font-medium text-muted-foreground">
                Transform long URLs into clean, shareable links.
              </p>
            </div>
          </div>

          {/* Usage Stats (Free Tier) */}
          {stats && !isPro && <UsageStats stats={stats} />}

          {/* Form */}
          <div className="space-y-8">
            {/* Destination URL */}
            <div className="space-y-2">
              <label className="text-[0.95rem] font-semibold text-foreground flex items-center gap-2">
                <Globe className="size-4.5 text-[var(--accent-brand)]" />
                Destination URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/my-long-url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(null) }}
                onBlur={() => setUrlError(validateUrl(url))}
                disabled={isLinkLimitReached || false}
                className={`w-full rounded-xl border bg-card px-4 py-3 text-[0.95rem] text-foreground placeholder:text-muted-foreground shadow-sm transition-all focus:outline-none focus:ring-[3px] disabled:opacity-50 disabled:cursor-not-allowed ${
                  urlError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/15 hover:border-red-400'
                    : 'border-border hover:border-border focus:border-[var(--accent-brand)] focus:ring-[var(--accent-brand)]/15'
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
                <label className="text-[0.95rem] font-semibold text-foreground flex items-center gap-2">
                  <Link2 className="size-4.5 text-[var(--accent-brand)]" />
                  Domain
                </label>
                <div className="flex h-12.5 w-full items-center rounded-xl border border-border bg-muted/50 px-4">
                  <span className="text-[0.95rem] font-medium text-muted-foreground">link-vault-theta.vercel.app</span>
                </div>
              </div>

              <AliasInput
                alias={alias}
                setAlias={setAlias}
                aliasStatus={aliasStatus}
                setAliasStatus={setAliasStatus}
                aliasError={aliasError}
                onCheckAlias={handleAliasChange}
                disabled={isLinkLimitReached || false}
              />
            </div>

            <div className="space-y-3.5">
              {/* QR Code Toggle */}
              <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all ${isPro || !isQrLimitReached ? 'hover:-translate-y-px hover:border-border hover:shadow-md' : 'opacity-75'}`}>
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={qrCode}
                    onChange={(e) => setQrCode(e.target.checked)}
                    disabled={loadingStats || (isPro && isLinkLimitReached) || (!isPro && isQrLimitReached)}
                    className="size-4.5 rounded border-border accent-[var(--accent-brand)] transition-transform group-active:scale-95 disabled:cursor-not-allowed"
                  />
                  <span className="text-[0.95rem] font-medium text-foreground">Generate QR Code</span>
                </div>
                {!isPro && isQrLimitReached && (
                  <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-muted-foreground">
                    Upgrade to Pro
                  </span>
                )}
              </label>

              {/* Link Expiration */}
              <div className={`rounded-xl border transition-all duration-200 ${expires && isPro ? 'border-[var(--accent-brand)]/30 bg-[var(--accent-brand)]/2' : 'border-border bg-card'}`}>
                <label className={`flex cursor-pointer items-center justify-between p-4 transition-all ${expires && isPro ? '' : 'hover:-translate-y-px hover:border-border hover:shadow-md'}`}>
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex size-4.5 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isPro ? expires : false}
                        onChange={(e) => isPro && setExpires(e.target.checked)}
                        disabled={!isPro || loadingStats}
                        readOnly={!isPro}
                        className="peer size-4.5 rounded border-border text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]/20 disabled:cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[0.95rem] font-medium text-foreground">Link Expiration</span>
                  </div>
                  {!isPro ? (
                    <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-muted-foreground">
                      Upgrade to Pro
                    </span>
                  ) : (
                    expires && (
                      <span className="rounded-md bg-[var(--accent-brand)]/10 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--accent-brand)]">
                        {getExpiryLabel(expiresIn)}
                      </span>
                    )
                  )}
                </label>

                {/* Expiry Duration Selector */}
                {expires && isPro && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <div className="mx-4 mb-4 h-px bg-[var(--accent-brand)]/10" />
                    <div className="px-4 pb-4">
                      <label className="text-[0.8rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                        Expires After
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger disabled={loadingStats} className="h-10 w-full sm:max-w-50 items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50 inline-flex">
                            <span className="flex items-center gap-2">
                              <Clock className="size-4 text-muted-foreground" />
                              {expiresIn && expiresIn !== 'custom'
                                ? PRESET_DURATIONS.find(d => d.value === expiresIn)?.label
                                : expiresIn === 'custom'
                                  ? 'Custom…'
                                  : 'Select duration…'}
                            </span>
                            <ChevronDown className="size-4 text-muted-foreground transition-transform" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[220px] rounded-xl border border-border bg-popover p-1.5 shadow-lg shadow-black/20 ring-1 ring-border-subtle">
                            {PRESET_DURATIONS.filter(d => d.value !== null).map(d => (
                              <DropdownMenuItem
                                key={d.value as string}
                                onClick={() => setExpiresIn(d.value as ExpiryDuration)}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${expiresIn === d.value ? 'bg-[var(--accent-brand)]/8 text-[var(--accent-brand)]' : 'text-foreground hover:bg-muted/50'}`}
                              >
                                {d.label}
                                {expiresIn === d.value && <Check className="size-4 text-[var(--accent-brand)]" strokeWidth={2.5} />}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-muted my-1" />
                            <DropdownMenuItem
                              onClick={() => setExpiresIn('custom')}
                              className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${expiresIn === 'custom' ? 'bg-[var(--accent-brand)]/8 text-[var(--accent-brand)]' : 'text-foreground hover:bg-muted/50'}`}
                            >
                              Custom…
                              {expiresIn === 'custom' && <Check className="size-4 text-[var(--accent-brand)]" strokeWidth={2.5} />}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Custom duration inputs */}
                        {expiresIn === 'custom' && (
                          <div className="flex items-center gap-2 animate-in fade-in duration-150">
                            <input
                              type="number"
                              min="1"
                              placeholder="Value"
                              value={customValue}
                              onChange={(e) => setCustomValue(e.target.value)}
                              disabled={loadingStats}
                              className="h-10 w-20 rounded-lg border border-border bg-card px-3 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50"
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger disabled={loadingStats} className="h-10 items-center justify-between gap-1.5 rounded-lg border border-border bg-card pl-3 pr-2 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50 inline-flex">
                                {customUnit === 'm' ? 'Min' : 'Hrs'}
                                <ChevronDown className="size-3.5 text-muted-foreground" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-25 rounded-xl border border-border bg-popover p-1.5 shadow-lg shadow-black/20 ring-1 ring-border-subtle">
                                <DropdownMenuItem
                                  onClick={() => setCustomUnit('m')}
                                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${customUnit === 'm' ? 'bg-[var(--accent-brand)]/8 text-[var(--accent-brand)]' : 'text-foreground hover:bg-muted/50'}`}
                                >
                                  Min
                                  {customUnit === 'm' && <Check className="size-4 text-[var(--accent-brand)]" strokeWidth={2.5} />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setCustomUnit('h')}
                                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${customUnit === 'h' ? 'bg-[var(--accent-brand)]/8 text-[var(--accent-brand)]' : 'text-foreground hover:bg-muted/50'}`}
                                >
                                  Hrs
                                  {customUnit === 'h' && <Check className="size-4 text-[var(--accent-brand)]" strokeWidth={2.5} />}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* UTM Tags */}
              <div className={`rounded-xl border transition-all duration-200 ${showUtms && isPro ? 'border-[var(--accent-brand)]/30 bg-[var(--accent-brand)]/2' : 'border-border bg-card'}`}>
                <label className={`flex cursor-pointer items-center justify-between p-4 transition-all ${showUtms && isPro ? '' : 'hover:-translate-y-px hover:border-border hover:shadow-md'}`}>
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex size-4.5 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isPro ? showUtms : false}
                        onChange={(e) => isPro && setShowUtms(e.target.checked)}
                        disabled={!isPro || loadingStats}
                        readOnly={!isPro}
                        className="peer size-4.5 rounded border-border text-[var(--accent-brand)] focus:ring-[var(--accent-brand)]/20 disabled:cursor-not-allowed"
                      />
                    </div>
                    <span className="flex items-center gap-2 text-[0.95rem] font-medium text-foreground">
                      <Tag className="size-4 text-[var(--accent-brand)]" />
                      UTM Tags
                    </span>
                  </div>
                  {!isPro ? (
                    <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-muted-foreground">
                      Upgrade to Pro
                    </span>
                  ) : (
                    showUtms && (utmSource || utmMedium || utmCampaign) && (
                      <span className="rounded-md bg-[var(--accent-brand)]/10 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--accent-brand)]">
                        Configured
                      </span>
                    )
                  )}
                </label>

                {showUtms && isPro && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <div className="mx-4 mb-4 h-px bg-[var(--accent-brand)]/10" />
                    <div className="px-4 pb-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex-1 space-y-1">
                          <label className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">Source</label>
                          <input
                            type="text"
                            placeholder="e.g. twitter"
                            value={utmSource}
                            onChange={(e) => setUtmSource(e.target.value)}
                            disabled={loadingStats}
                            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">Medium</label>
                          <input
                            type="text"
                            placeholder="e.g. social"
                            value={utmMedium}
                            onChange={(e) => setUtmMedium(e.target.value)}
                            disabled={loadingStats}
                            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">Campaign</label>
                          <input
                            type="text"
                            placeholder="e.g. summer_sale"
                            value={utmCampaign}
                            onChange={(e) => setUtmCampaign(e.target.value)}
                            disabled={loadingStats}
                            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Click Analytics */}
              <label className={`flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all ${isPro ? 'hover:-translate-y-px hover:border-border hover:shadow-md' : 'opacity-75'}`}>
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={isPro}
                    disabled
                    className="size-4.5 rounded border-border accent-[var(--accent-brand)] cursor-default"
                  />
                  <span className="text-[0.95rem] font-medium text-foreground">Click Analytics</span>
                </div>
                {!isPro ? (
                  <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-muted-foreground">
                    Upgrade to Pro
                  </span>
                ) : (
                  <span className="rounded bg-muted px-2 py-1 text-[0.75rem] font-semibold text-muted-foreground">Active</span>
                )}
              </label>
            </div>
          </div>

          <div className="my-10 h-px w-full bg-linear-to-r from-transparent via-slate-200 to-transparent" />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={isLinkLimitReached || loadingStats || isPending}
              className="h-12 w-full rounded-xl border border-[var(--accent-brand-hover)] bg-linear-to-b from-[var(--accent-brand)] to-[var(--accent-brand)] px-10 text-[1rem] font-semibold text-white shadow-[0_2px_5px_rgba(43,0,148,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:from-[var(--accent-brand-active)] hover:to-[var(--accent-brand)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] disabled:opacity-50 sm:w-auto"
            >
              {isPending ? 'Creating...' : isLinkLimitReached ? 'Limit Reached' : 'Create Short Link'}
            </Button>
          </div>
        </div>

        {/* ── Right Column: Preview Sidebar ── */}
        <div className="sticky top-10 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <PreviewSidebar
            baseUrl={baseUrl}
            alias={alias}
            qrCode={qrCode}
            expires={expires}
            expiresIn={expiresIn}
            getExpiryLabel={getExpiryLabel}
            createdData={createdData}
            isPro={isPro}
            stats={stats}
          />
        </div>
      </div>
    </div>
  )
}
