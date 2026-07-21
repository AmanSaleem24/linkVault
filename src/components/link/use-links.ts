import { useState, useCallback, useEffect, useRef } from 'react'
import useSWRInfinite from 'swr/infinite'
import { getLinksAction, type LinksListParams, type LinksResult } from '@/app/actions/links.read'
import { toggleLinkStatusAction, deleteLinkAction } from '@/app/actions/links.delete'
import { getUserRoleAction } from '@/app/actions/user.getRole'
import { toast } from 'sonner'
import { type LinkStatus } from '@/lib/validators'
import { type LinkRowData } from '@/components/home/link-row'
import { type DateFilter } from '@/components/home/date-filter-popover'
import { type SortState } from '@/components/home/sort-dropdown'

const PAGE_SIZE = 20

export function useLinks() {
  const [isMutating, setIsMutating] = useState(false)
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

  // SWR Keys and Fetcher
  const getKey = (pageIndex: number, previousPageData: (LinksResult & { success: true }) | null) => {
    if (previousPageData && !previousPageData.data?.hasMore) return null

    const cursor = previousPageData?.data?.nextCursor || undefined
    return [
      'links',
      {
        cursor,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: sort.field,
        sortOrder: sort.order,
        dateFrom: dateFilter.from || undefined,
        dateTo: dateFilter.to || undefined,
      },
    ]
  }

  const fetcher = async ([, params]: [string, LinksListParams]) => {
    const result = await getLinksAction(params)
    if (!result.success) throw new Error(result.error || 'Failed to load')
    return result
  }

  const { data, size, setSize, mutate, isLoading: isSwrLoading } = useSWRInfinite(
    getKey,
    fetcher,
    { revalidateFirstPage: false, revalidateOnFocus: true }
  )

  const links = data ? data.flatMap((page) => page.data?.links || []) : []
  const totalCount = data?.[0]?.data?.totalCount || 0
  const hasMore = data?.[data.length - 1]?.data?.hasMore || false

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(value)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // Mutations
  async function handleToggleStatus(link: LinkRowData) {
    setIsMutating(true)
    const newStatus = link.status === 'active' ? 'disabled' : 'active'
    const result = await toggleLinkStatusAction(link.id, newStatus)
    setIsMutating(false)
    if (result.success) {
      toast.success(`Link ${newStatus === 'active' ? 'enabled' : 'disabled'}`)
      mutate()
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
      mutate()
    } else {
      toast.error(result.error || 'Failed to delete link')
    }
  }

  function handleLoadMore() {
    if (hasMore) setSize(size + 1)
  }

  return {
    isLoading: isSwrLoading || isMutating,
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
