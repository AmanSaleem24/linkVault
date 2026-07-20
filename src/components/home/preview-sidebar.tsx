'use client'

import Link from 'next/link'
import { Link as LinkIcon, Star, CheckCircle2, Globe, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QRCode } from 'react-qrcode-logo'
import { toast } from 'sonner'
import { type LinkStats } from '@/components/home/use-create-link'

import { type ExpiryDuration } from '@/lib/validators'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PreviewSidebarProps {
  baseUrl: string
  alias: string
  qrCode: boolean
  expires: boolean
  expiresIn: number | string | null
  getExpiryLabel: (v: ExpiryDuration) => string
  createdData: { shortUrl: string; originalUrl: string; hasQr: boolean } | null
  isPro: boolean
  stats: LinkStats | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PreviewSidebar({
  baseUrl,
  alias,
  qrCode,
  expires,
  expiresIn,
  getExpiryLabel,
  createdData,
}: PreviewSidebarProps) {

  if (createdData) {
    // ── SUCCESS STATE ───────────────────────────────────────────────────────
    return (
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
                  <QRCode value={createdData.shortUrl} size={120} fgColor="#0F172A" />
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
    )
  }

  // ── LIVE PREVIEW STATE ────────────────────────────────────────────────────
  return (
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
                <QRCode value={`${baseUrl}/${alias || 'preview'}`} size={112} fgColor="#0F172A" />
              </div>
            </div>
          </div>
        )}

        <div className="my-8 h-px w-full bg-linear-to-r from-transparent via-slate-200 to-transparent" />

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
              Expires: {getExpiryLabel(expiresIn as ExpiryDuration)}
            </li>
          )}
          <li className="flex items-center gap-3 text-slate-400">
            <Star className="size-4.5 text-slate-300" strokeWidth={2.5} />
            Click Analytics (Pro)
          </li>
        </ul>
      </div>
    </>
  )
}
