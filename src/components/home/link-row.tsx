'use client'

import { Copy, Eye, Pencil, Trash2, ToggleLeft, ToggleRight, BarChart2, MoreHorizontal, ExternalLink, Globe, CornerDownRight, Calendar, Lock, Share2 } from 'lucide-react'
import { type LinkStatus } from '@/lib/validators'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ShareDialog } from '@/components/dashboard/share-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkRowData {
  id: string
  originalUrl: string
  slug: string
  status: LinkStatus
  clickCount: number
  expiresAt: string | null
  createdAt: string
}

export type ViewMode = 'list' | 'compact'

export interface LinkRowProps {
  link: LinkRowData
  viewMode: ViewMode
  isPro: boolean
  onCopy: () => void
  onViewDetails: () => void
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
  onOpen: () => void
  truncateUrl: (url: string) => string
  getLinkTitle: (url: string) => string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LinkRow({
  link,
  viewMode,
  isPro,
  onCopy,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
  onOpen,
  truncateUrl,
  getLinkTitle,
}: LinkRowProps) {
  const isCompact = viewMode === 'compact'

  return (
    <div className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      {/* Row 1: checkbox, favicon, title, action icons */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-4 shrink-0 rounded border-slate-300 accent-[#3D52A0] cursor-pointer"
        />

        {/* Favicon */}
        {!isCompact && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            <Globe className="size-4" />
          </div>
        )}

        {/* Title */}
        <span className="flex-1 truncate text-base font-semibold text-slate-900">
          {getLinkTitle(link.originalUrl)}
        </span>

        {/* Action icons */}
        <div className="flex shrink-0 items-center gap-0.5">
          <ShareDialog
            url={typeof window !== 'undefined' ? `${window.location.origin}/${link.slug}` : `https://link-vault-theta.vercel.app/${link.slug}`}
            title={getLinkTitle(link.originalUrl)}
          >
            <button
              title="Share"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Share2 className="size-4" />
            </button>
          </ShareDialog>
          <button
            onClick={onEdit}
            title="Edit"
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={isPro ? onViewDetails : undefined}
            title={isPro ? 'View analytics' : 'Upgrade to see click analytics'}
            className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
              isPro
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            {isPro ? (
              <BarChart2 className="size-4" />
            ) : (
              <Lock className="size-4" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
              <DropdownMenuItem
                onClick={onCopy}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Copy className="size-4 text-slate-500" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpen}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <ExternalLink className="size-4 text-slate-500" />
                Open link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onViewDetails}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Eye className="size-4 text-slate-500" />
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem
                onClick={onEdit}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Pencil className="size-4 text-slate-500" />
                Edit link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onToggleStatus}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {link.status === 'active' ? (
                  <>
                    <ToggleLeft className="size-4 text-slate-500" />
                    Disable link
                  </>
                ) : (
                  <>
                    <ToggleRight className="size-4 text-emerald-500" />
                    Enable link
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem
                onClick={onDelete}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="size-4 text-red-400" />
                Delete link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: short link */}
      <div className="mt-2.5 flex items-center gap-2 pl-9">
        <a
          href={link.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-mono text-sm font-semibold text-brand-500 hover:underline transition-colors truncate"
        >
          {typeof window !== 'undefined' ? `${window.location.host}/${link.slug}` : link.slug}
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); onCopy() }}
          title="Copy short link"
          className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-700"
        >
          <Copy className="size-3.5" />
        </button>
      </div>

      {/* Row 3: destination URL */}
      <div className="mt-1.5 flex items-center gap-1.5 pl-9">
        <CornerDownRight className="size-3.5 shrink-0 text-slate-500" />
        <span className="truncate text-sm text-slate-600">
          {truncateUrl(link.originalUrl)}
        </span>
      </div>

      {/* Row 4: metadata pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-9">
        {/* Click data pill */}
        {isPro ? (
          <button
            onClick={onViewDetails}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.75rem] font-medium text-slate-600 transition-colors hover:border-brand-400/30 hover:bg-brand-400/5 hover:text-brand-400 cursor-pointer"
          >
            <BarChart2 className="size-3.5 text-slate-500" />
            {link.clickCount.toLocaleString()} clicks
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1 text-[0.75rem] font-medium text-slate-500 cursor-not-allowed">
            <Lock className="size-3.5 text-slate-400" />
            Click data
          </span>
        )}

        {/* Date pill */}
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.75rem] font-medium text-slate-600">
          <Calendar className="size-3.5 text-slate-500" />
          {formatDate(link.createdAt)}
        </span>
      </div>
    </div>
  )
}
