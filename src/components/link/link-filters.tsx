import { Search, LayoutList, LayoutGrid } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DateFilterPopover, type DateFilter } from '@/components/home/date-filter-popover'
import { SortDropdown, type SortState } from '@/components/home/sort-dropdown'
import { type LinkStatus } from '@/lib/validators'

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' as const },
  { label: 'Active', value: 'active' as const },
  { label: 'Disabled', value: 'disabled' as const },
  { label: 'Expired', value: 'expired' as const },
]

interface LinkFiltersProps {
  searchInput: string
  onSearchChange: (value: string) => void
  statusFilter: 'all' | LinkStatus
  onStatusChange: (status: 'all' | LinkStatus) => void
  dateFilter: DateFilter
  onDateChange: (filter: DateFilter) => void
  sort: SortState
  onSortChange: (sort: SortState) => void
  viewMode: 'list' | 'compact'
  onViewModeChange: (mode: 'list' | 'compact') => void
}

export function LinkFilters({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: LinkFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by URL or slug…"
          value={searchInput}
          onChange={e => onSearchChange(e.target.value)}
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
                onClick={() => onStatusChange(option.value)}
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
            onDateChange({ preset: preset ?? null, from, to })
          }}
          onClear={() => onDateChange({ preset: null, from: null, to: null })}
        />

        {/* Sort dropdown */}
        <SortDropdown
          sort={sort}
          onSort={onSortChange}
        />

        {/* View Mode Toggle */}
        <div className="ml-2 flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex size-8 items-center justify-center rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
            title="List View"
          >
            <LayoutList className="size-4" />
          </button>
          <button
            onClick={() => onViewModeChange('compact')}
            className={`flex size-8 items-center justify-center rounded-md transition-colors ${viewMode === 'compact' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
            title="Compact View"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
