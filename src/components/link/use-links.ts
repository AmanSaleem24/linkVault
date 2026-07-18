import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { getLinksAction } from '@/app/actions/links.read'
import { toggleLinkStatusAction, deleteLinkAction } from '@/app/actions/links.delete'
import { getUserRoleAction } from '@/app/actions/user.getRole'
import { toast } from 'sonner'
import { type LinkStatus } from '@/lib/validators'
import { type LinkRowData } from '@/components/home/link-row'
import { type DateFilter } from '@/components/home/date-filter-popover'
import { type SortState } from '@/components/home/sort-dropdown'

const PAGE_SIZE = 20

export function useLinks() {
  const [isPending, startTransition] = useTransition()
  const [isMutating, setIsMutating] = useState(false)

  // Data
  const [links, setLinks] = useState<LinkRowData[]>([])
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
  const [statusFilter, setStatusFilter] = useState<'all' | LinkStatus>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>({ preset: null, from: null, to: null })

  // Sort
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', order: 'desc' })

  // UI state
  const [viewMode, setViewMode] = useState<'list' | 'compact'>('list')

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

        if (result.success && result.data) {
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
          toast.error('Failed to load links')
        }
      })
    },
    [search, statusFilter, sort.field, sort.order, dateFilter.from, dateFilter.to],
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
  }, [search, statusFilter, dateFilter.from, dateFilter.to, sort.field, sort.order, loadLinks])

  useEffect(() => {
    function handleFocus() {
      loadLinks(undefined, true)
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadLinks])

  // Mutations
  async function handleToggleStatus(link: LinkRowData) {
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

  return {
    isLoading: isPending || isMutating,
    links,
    totalCount,
    hasMore,
    isPro,
    viewMode,
    setViewMode,
    search,
    searchInput,
    handleSearchChange,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    sort,
    setSort,
    handleToggleStatus,
    handleDelete,
    handleLoadMore,
  }
}
