'use client'

import { type SortField } from '@/app/actions/links.read'
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortState = { field: SortField; order: 'asc' | 'desc' }

export interface SortDropdownProps {
  sort: SortState
  onSort: (s: SortState) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_ROWS = [
  { label: 'Date created', value: 'createdAt' as const, defaultOrder: 'desc' as const },
  { label: 'URL', value: 'originalUrl' as const, defaultOrder: 'asc' as const },
  { label: 'Slug', value: 'slug' as const, defaultOrder: 'asc' as const },
  { label: 'Clicks', value: 'clickCount' as const, defaultOrder: 'desc' as const },
]

const SORT_TRIGGER_LABEL: Record<string, (order: 'asc' | 'desc') => string> = {
  createdAt: (o) => `Date created · ${o === 'desc' ? 'Newest first' : 'Oldest first'}`,
  originalUrl: (o) => `URL · ${o === 'asc' ? 'A→Z' : 'Z→A'}`,
  slug: (o) => `Slug · ${o === 'asc' ? 'A→Z' : 'Z→A'}`,
  clickCount: (o) => `Clicks · ${o === 'desc' ? 'Most first' : 'Least first'}`,
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SortDropdown({ sort, onSort }: SortDropdownProps) {
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
