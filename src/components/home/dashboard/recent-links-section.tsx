'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Copy, CheckCheck, ExternalLink, Lock, Globe } from 'lucide-react'
import { toast } from 'sonner'
import type { RecentLinkRow } from '@/app/actions/dashboard'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecentLinksSectionProps {
  links: RecentLinkRow[]
  isPro: boolean
}

// ─── Favicon helper ───────────────────────────────────────────────────────────

function FaviconImg({ url }: { url: string }) {
  const [errored, setErrored] = useState(false)
  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch {
    /* ignore */
  }

  if (!hostname || errored) {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Globe className="size-4" />
      </div>
    )
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt={hostname}
        className="size-4 object-contain"
        onError={() => setErrored(true)}
      />
    </div>
  )
}

// ─── Single row ───────────────────────────────────────────────────────────────

function RecentLinkItem({
  link,
  isPro,
  baseUrl,
}: {
  link: RecentLinkRow
  isPro: boolean
  baseUrl: string
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const short = `${baseUrl}/${link.slug}`
    navigator.clipboard.writeText(short)
    toast.success('Copied to clipboard!')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Truncate destination URL for display
  let displayUrl = link.originalUrl
  try {
    const parsed = new URL(link.originalUrl)
    displayUrl = parsed.hostname + parsed.pathname.replace(/\/$/, '')
    if (displayUrl.length > 55) displayUrl = displayUrl.slice(0, 52) + '…'
  } catch {
    if (displayUrl.length > 55) displayUrl = displayUrl.slice(0, 52) + '…'
  }

  return (
    <div className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70">
      {/* Favicon */}
      <FaviconImg url={link.originalUrl} />

      {/* URLs */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/link/${link.id}`}
            className="truncate font-mono text-[0.88rem] font-semibold text-[#2B0094] hover:underline"
          >
            {baseUrl.replace(/^https?:\/\//, '')}/{link.slug}
          </Link>
          <button
            onClick={handleCopy}
            title="Copy short link"
            className="shrink-0 rounded p-0.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:text-slate-600"
          >
            {copied ? (
              <CheckCheck className="size-3.5 text-green-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
        <p className="truncate text-[0.78rem] text-slate-400">{displayUrl}</p>
      </div>

      {/* Click count — gated */}
      <div className="shrink-0 text-right">
        {isPro && link.clickCount !== null ? (
          <Link
            href={`/link/${link.id}`}
            className="text-[0.85rem] font-semibold text-slate-600 hover:text-[#2B0094] transition-colors"
          >
            {link.clickCount.toLocaleString()} clicks
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[0.82rem] text-slate-400">
            <Lock className="size-3 text-slate-400" />
            clicks
          </span>
        )}
      </div>

      {/* External link icon */}
      <a
        href={link.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Open original URL"
        className="shrink-0 rounded p-0.5 text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:text-slate-500"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecentLinksSection({ links, isPro }: RecentLinksSectionProps) {
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    setBaseUrl(process.env.NEXT_PUBLIC_BASE_URL || window.location.origin)
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Recent links</h2>
        <Link
          href="/link"
          id="recent-links-view-all"
          className="text-[0.82rem] font-semibold text-[#2B0094] hover:underline underline-offset-2"
        >
          View all
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-16 text-center shadow-sm">
          <p className="text-[0.95rem] font-semibold text-slate-600">No links yet</p>
          <p className="mt-1 text-[0.82rem] text-slate-400">
            Create your first short link to get started
          </p>
          <Link
            href="/links/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#23007A] bg-gradient-to-b from-[#3D00D1] to-[#2B0094] px-4 py-2 text-[0.85rem] font-semibold text-white shadow-[0_2px_5px_rgba(43,0,148,0.3)] transition-all hover:from-[#4300E6] hover:to-[#3100A8]"
          >
            Create a link
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm divide-y divide-slate-100">
          {links.map((link) => (
            <RecentLinkItem
              key={link.id}
              link={link}
              isPro={isPro}
              baseUrl={baseUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}
