'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link as LinkIcon, Loader2, Plus, Download } from 'lucide-react'
import { LinkRow } from '@/components/home/link-row'
import { useLinks } from '@/components/link/use-links'
import { LinkFilters } from '@/components/link/link-filters'
import { copyToClipboard, truncateUrl, getLinkTitle } from '@/components/link/link-helpers'
import { exportLinksAction } from '@/app/actions/links.read'
import { toast } from 'sonner'

export default function AllLinksPage() {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportLinksAction()
      if (result.success) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `linkvault-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('CSV exported successfully')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsExporting(false)
    }
  }

  const {
    isLoading,
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
  } = useLinks()

  return (
    <div className="global-content py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Links</h1>
          <p className="mt-1.5 text-base text-slate-500">
            {totalCount} link{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || isLoading}
          variant="outline"
          className="h-10 gap-2 bg-[#3D52A0] px-5 text-[0.875rem] font-semibold text-white shadow-sm hover:bg-brand-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/40 rounded-lg"
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download CSV
        </Button>
      </div>

      {/* Filters bar */}
      <LinkFilters
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

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
                onClick={() => router.push('/links/new')}
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
            <span className="text-[0.85rem] text-slate-400">You{`'`}ve reached the end</span>
          )}
          <span className="h-px w-16 bg-slate-200" />
        </div>
      )}
    </div>
  )
}
