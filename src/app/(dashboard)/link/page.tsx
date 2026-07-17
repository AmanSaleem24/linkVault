'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getLinksAction, type SortField } from '@/app/actions/links.read'
import { toggleLinkStatusAction, deleteLinkAction } from '@/app/actions/links.delete'
import { getUserRoleAction } from '@/app/actions/user.getRole'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ExternalLink,
  MoreHorizontal,
  Search,
  Copy,
  Eye,
  Link as LinkIcon,
  Loader2,
  Plus,
  Globe,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BarChart2,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Lock,
  CornerDownRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { type LinkStatus } from '@/lib/validators'

const PAGE_SIZE = 20

// ─── Types ────────────────────────────────────────────────────────────────────

interface LinkRow {
  id: string
  originalUrl: string
  slug: string
  status: LinkStatus
  clickCount: number
  expiresAt: string | null
  createdAt: string
}

type StatusFilterOption = 'all' | LinkStatus
type ViewMode = 'list' | 'compact'

const STATUS_OPTIONS: { label: string; value: StatusFilterOption; color: string }[] = [
  { label: 'All', value: 'all', color: 'bg-slate-100 text-slate-700' },
  { label: 'Active', value: 'active', color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Disabled', value: 'disabled', color: 'bg-slate-100 text-slate-600' },
  { label: 'Expired', value: 'expired', color: 'bg-amber-50 text-amber-700' },
]

const DATE_PRESETS = [
  { label: 'Today', getRange: () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)
    return { from: today.toISOString(), to: end.toISOString() }
  }},
  { label: 'Last 7 days', getRange: () => {
    const from = new Date()
    from.setDate(from.getDate() - 7)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }},
  { label: 'Last 30 days', getRange: () => {
    const from = new Date()
    from.setDate(from.getDate() - 30)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }},
  { label: 'Last 90 days', getRange: () => {
    const from = new Date()
    from.setDate(from.getDate() - 90)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }},
]

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
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Globe className="size-4" />
      </div>
    )
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt={hostname}
        className="size-5 object-contain"
        onError={() => setErrored(true)}
      />
    </div>
  )
}

// ─── Date Filter Popover ─────────────────────────────────────────────────────

function DateFilterPopover({
  dateFrom, dateTo, onApply, onClear, activeLabel,
}: {
  dateFrom: string | null
  dateTo: string | null
  onApply: (from: string, to: string, preset?: string) => void
  onClear: () => void
  activeLabel?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [localFrom, setLocalFrom] = useState(dateFrom || '')
  const [localTo, setLocalTo] = useState(dateTo || '')
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')

  // Sync with external state
  useEffect(() => {
    setLocalFrom(dateFrom || '')
    setLocalTo(dateTo || '')
  }, [dateFrom, dateTo])

  const handlePreset = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getRange()
    setLocalFrom(range.from.slice(0, 10))
    setLocalTo(range.to.slice(0, 10))
    onApply(range.from.slice(0, 10), range.to.slice(0, 10), preset.label)
    setOpen(false)
  }

  const handleCustomApply = () => {
    if (!localFrom || !localTo) {
      toast.error('Please select both dates')
      return
    }
    if (localFrom > localTo) {
      toast.error('From date must be before To date')
      return
    }
    onApply(localFrom, localTo)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-[0.875rem] font-medium shadow-sm transition-all ${
          activeLabel
            ? 'border-[#3D52A0]/30 bg-[#3D52A0]/5 text-[#3D52A0]'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <Calendar className="size-4" />
        {activeLabel || 'Filter by created date'}
        {activeLabel && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onClear(); setLocalFrom(''); setLocalTo(''); }}
            className="ml-1 rounded-full p-0.5 hover:bg-[#3D52A0]/10"
          >
            <X className="size-3" />
          </span>
        )}
        <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60">
            {/* Mode tabs */}
            <div className="mb-3 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setMode('preset')}
                className={`flex-1 rounded-md py-1.5 text-[0.8rem] font-medium transition-all ${
                  mode === 'preset' ? 'bg-white text-[#3D52A0] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Quick select
              </button>
              <button
                onClick={() => setMode('custom')}
                className={`flex-1 rounded-md py-1.5 text-[0.8rem] font-medium transition-all ${
                  mode === 'custom' ? 'bg-white text-[#3D52A0] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Custom range
              </button>
            </div>

            {mode === 'preset' ? (
              <div className="flex flex-col gap-1">
                {DATE_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset)}
                    className="rounded-lg px-3 py-2 text-left text-[0.85rem] font-medium text-slate-700 transition-colors hover:bg-[#3D52A0]/5 hover:text-[#3D52A0]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[0.75rem] font-medium text-slate-500">From</label>
                  <input
                    type="date"
                    value={localFrom}
                    onChange={e => setLocalFrom(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[0.85rem] text-slate-700 focus:border-[#3D52A0] focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[0.75rem] font-medium text-slate-500">To</label>
                  <input
                    type="date"
                    value={localTo}
                    onChange={e => setLocalTo(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 px-3 text-[0.85rem] text-slate-700 focus:border-[#3D52A0] focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/15"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleCustomApply}
                    className="h-9 flex-1 bg-[#3D52A0] text-[0.85rem] font-semibold text-white hover:bg-brand-500 rounded-lg"
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={() => { onClear(); setLocalFrom(''); setLocalTo(''); setOpen(false); }}
                    variant="outline"
                    className="h-9 flex-1 border-slate-200 text-[0.85rem] font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sort Dropdown ───────────────────────────────────────────────────────────

type SortState = { field: SortField; order: 'asc' | 'desc' }

const SORT_ROWS: { label: string; value: Exclude<SortField, 'status'>; defaultOrder: 'asc' | 'desc' }[] = [
  { label: 'Date created', value: 'createdAt', defaultOrder: 'desc' },
  { label: 'URL', value: 'originalUrl', defaultOrder: 'asc' },
  { label: 'Slug', value: 'slug', defaultOrder: 'asc' },
  { label: 'Clicks', value: 'clickCount', defaultOrder: 'desc' },
]

const SORT_TRIGGER_LABEL: Record<string, (order: 'asc' | 'desc') => string> = {
  createdAt: (o) => `Date created · ${o === 'desc' ? 'Newest first' : 'Oldest first'}`,
  originalUrl: (o) => `URL · ${o === 'asc' ? 'A→Z' : 'Z→A'}`,
  slug: (o) => `Slug · ${o === 'asc' ? 'A→Z' : 'Z→A'}`,
  clickCount: (o) => `Clicks · ${o === 'desc' ? 'Most first' : 'Least first'}`,
}

function SortDropdown({ sort, onSort }: { sort: SortState; onSort: (s: SortState) => void }) {
  const activeRow = SORT_ROWS.find(r => r.value === sort.field)

  const handleRowClick = (row: typeof SORT_ROWS[0]) => {
    if (sort.field === row.value) {
      // Toggle direction on the same field
      onSort({ field: row.value, order: sort.order === 'desc' ? 'asc' : 'desc' })
    } else {
      // Switch field, use its default direction
      onSort({ field: row.value, order: row.defaultOrder })
    }
    // Don't close — let the user see the direction flip
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[0.875rem] font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none">
        <ArrowUpDown className="size-4 text-slate-400" />
        {activeRow ? SORT_TRIGGER_LABEL[sort.field]?.(sort.order) ?? 'Sort' : 'Sort'}
        <ChevronDown className="size-3.5 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
        {SORT_ROWS.map(row => {
          const isActive = sort.field === row.value
          return (
            <button
              key={row.value}
              onClick={() => handleRowClick(row)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-brand-400/10 text-brand-400'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {row.label}
              {isActive && (
                sort.order === 'desc'
                  ? <ChevronDown className="size-3.5 text-brand-400" />
                  : <ChevronUp className="size-3.5 text-brand-400" />
              )}
            </button>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllLinksPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isMutating, setIsMutating] = useState(false)

  // Data
  const [links, setLinks] = useState<LinkRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isPro, setIsPro] = useState(false)

  // Fetch user role
  useEffect(() => {
    getUserRoleAction().then(result => {
      if (result.isPro) setIsPro(true)
    })
  }, [])

  // Filters
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('all')
  const [dateFilter, setDateFilter] = useState<{ preset: string | null; from: string | null; to: string | null }>({
    preset: null, from: null, to: null,
  })

  // Sort
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', order: 'desc' })

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load links
  const loadLinks = useCallback(
    (cursor?: string, reset = false) => {
      startTransition(async () => {
        const result = await getLinksAction({
          cursor,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          sortBy: sort.field,
          sortOrder: sort.order,
          dateFrom: dateFilter.from || undefined,
          dateTo: dateFilter.to || undefined,
        })

        if (result.success) {
          const data = result.data
          if (reset) {
            setLinks(data.links)
          } else {
            setLinks(prev => [...prev, ...data.links])
          }
          setNextCursor(data.nextCursor)
          setHasMore(data.hasMore)
          setTotalCount(data.totalCount)
        } else {
          toast.error(result.error || 'Failed to load links')
        }
      })
    },
    [search, statusFilter, sort.field, sort.order, dateFilter.from, dateFilter.to, startTransition],
  )

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
      setNextCursor(null)
    }, 300)
  }, [])

  useEffect(() => {
    loadLinks(undefined, true)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, statusFilter, dateFilter.from, dateFilter.to, sort.field, sort.order])

  useEffect(() => {
    function handleFocus() {
      loadLinks(undefined, true)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadLinks])

  // Helpers
  function copyToClipboard(text: string, label = 'Copied!') {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(label)
      }).catch(() => {
        fallbackCopy(text, label)
      })
    } else {
      fallbackCopy(text, label)
    }
  }

  function fallbackCopy(text: string, label: string) {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy') // eslint-disable-next-line deprecation/deprecation
      toast.success(label)
    } catch {
      toast.error('Failed to copy — please copy manually')
    }
    document.body.removeChild(textarea)
  }

  function getShortLink(slug: string) {
    return `${window.location.host}/${slug}`
  }

  function truncateUrl(url: string) {
    try {
      const u = new URL(url)
      const full = u.hostname + u.pathname
      return full.length > 55 ? full.slice(0, 55) + '…' : full
    } catch {
      return url.length > 55 ? url.slice(0, 55) + '…' : url
    }
  }

  function getLinkTitle(url: string) {
    try {
      const u = new URL(url)
      return u.hostname.replace('www.', '')
    } catch {
      return 'Untitled'
    }
  }

  // Mutations
  async function handleToggleStatus(link: LinkRow) {
    setIsMutating(true)
    const newStatus = link.status === 'active' ? 'disabled' : 'active'
    const result = await toggleLinkStatusAction(link.id, newStatus)
    setIsMutating(false)
    if (result.success) {
      toast.success(`Link ${newStatus === 'active' ? 'enabled' : 'disabled'}`)
      loadLinks(undefined, true)
    } else {
      toast.error(result.error || 'Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this link? This cannot be undone.')) return
    setIsMutating(true)
    const result = await deleteLinkAction(id)
    setIsMutating(false)
    if (result.success) {
      toast.success('Link deleted')
      loadLinks(undefined, true)
    } else {
      toast.error(result.error || 'Failed to delete link')
    }
  }

  function handleLoadMore() {
    if (nextCursor && hasMore) loadLinks(nextCursor)
  }

  function handleSort(field: SortField) {
    if (field === sort.field) {
      setSort(prev => ({ ...prev, order: prev.order === 'desc' ? 'asc' : 'desc' }))
    } else {
      const defaultOrder = SORT_ROWS.find(r => r.value === field)?.defaultOrder ?? 'desc'
      setSort({ field, order: defaultOrder })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isLoading = isPending || isMutating

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[1.6rem] font-bold tracking-tight text-slate-900">All Links</h1>
          <p className="mt-1.5 text-[0.875rem] text-slate-500">
            {totalCount} link{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          onClick={() => router.push('/home')}
          className="h-10 gap-2 bg-[#3D52A0] px-5 text-[0.875rem] font-semibold text-white shadow-sm hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/40 rounded-lg"
        >
          <Plus className="size-4" />
          Create link
        </Button>
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by URL or slug…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-[0.9rem] text-slate-900 placeholder:text-slate-400 shadow-sm transition-all hover:border-slate-300 focus:border-[#3D52A0] focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/15"
          />
        </div>

        {/* Status + Date + Sort */}
        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[0.875rem] font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none">
              {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label ?? 'All'}
              <svg className="size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/60">
              {STATUS_OPTIONS.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${
                    statusFilter === option.value
                      ? 'bg-[#3D52A0]/10 text-[#3D52A0]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`inline-block size-2 rounded-full ${option.value === 'all' ? 'bg-slate-400' : option.value === 'active' ? 'bg-emerald-400' : option.value === 'disabled' ? 'bg-slate-400' : 'bg-amber-400'}`} />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date filter */}
          <DateFilterPopover
            dateFrom={dateFilter.from}
            dateTo={dateFilter.to}
            activeLabel={dateFilter.preset ?? (dateFilter.from && dateFilter.to ? 'Custom' : null)}
            onApply={(from, to, preset) => {
              setDateFilter({ preset: preset ?? null, from, to })
            }}
            onClear={() => setDateFilter({ preset: null, from: null, to: null })}
          />

          {/* Sort dropdown */}
          <SortDropdown
            sort={sort}
            onSort={setSort}
          />
        </div>
      </div>

      {/* Link List */}
      <div className="space-y-2">
        {/* Loading skeleton */}
        {isLoading && links.length === 0 && (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
                <div className="size-9 shrink-0 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-64 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && links.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 text-center shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100">
              <LinkIcon className="size-6 text-slate-400" />
            </div>
            <p className="text-[1rem] font-semibold text-slate-700">No links found</p>
            <p className="mt-1.5 text-[0.875rem] text-slate-400">
              {search || statusFilter !== 'all' || dateFilter.from || dateFilter.to
                ? 'Try adjusting your search or filters'
                : 'Create your first short link to get started'}
            </p>
            {!search && statusFilter === 'all' && !dateFilter.from && !dateFilter.to && (
              <Button
                onClick={() => router.push('/home')}
                className="mt-5 h-9 gap-1.5 bg-[#3D52A0] px-4 text-[0.875rem] font-semibold text-white hover:bg-brand-500 rounded-lg"
              >
                <Plus className="size-4" />
                Create link
              </Button>
            )}
          </div>
        )}

        {/* Link rows */}
        {links.map(link => (
          <LinkRow
            key={link.id}
            link={link}
            viewMode={viewMode}
            isPro={isPro}
            onCopy={() => copyToClipboard(`${window.location.origin}/${link.slug}`, 'Short link copied!')}
            onViewDetails={() => router.push(`/link/${link.id}`)}
            onEdit={() => router.push(`/link/${link.id}/edit`)}
            onToggleStatus={() => handleToggleStatus(link)}
            onDelete={() => handleDelete(link.id)}
            onOpen={() => window.open(`/${link.slug}`, '_blank')}
            truncateUrl={truncateUrl}
            getLinkTitle={getLinkTitle}
          />
        ))}

        {/* Load more spinner */}
        {isLoading && links.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-5 animate-spin text-[#3D52A0]" />
          </div>
        )}
      </div>

      {/* Load More / End of list */}
      {!isLoading && links.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="h-px w-16 bg-slate-200" />
          {hasMore ? (
            <button
              onClick={handleLoadMore}
              className="text-[0.85rem] font-medium text-slate-500 hover:text-[#3D52A0] transition-colors"
            >
              Load more links
            </button>
          ) : (
            <span className="text-[0.85rem] text-slate-400">You've reached the end</span>
          )}
          <span className="h-px w-16 bg-slate-200" />
        </div>
      )}
    </div>
  )
}

// ─── LinkRow ─────────────────────────────────────────────────────────────────

interface LinkRowProps {
  link: LinkRow
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

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function LinkRow({
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

  // Share feature — commented out for now
  // function handleShare() {
  //   onCopy()
  // }

  return (
    <div className="group rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      {/* Row 1: checkbox, favicon, title, action icons */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-4 shrink-0 rounded border-slate-300 accent-[#3D52A0] cursor-pointer"
        />

        {/* Favicon */}
        {!isCompact && <FaviconImg url={link.originalUrl} />}

        {/* Title */}
        <span className="flex-1 truncate text-[0.9rem] font-semibold text-slate-900">
          {getLinkTitle(link.originalUrl)}
        </span>

        {/* Action icons */}
        <div className="flex shrink-0 items-center gap-0.5">
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
          className="flex items-center gap-1.5 font-mono text-[0.82rem] font-semibold text-brand-500 hover:underline transition-colors truncate"
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
        <span className="truncate text-[0.82rem] text-slate-600">
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
