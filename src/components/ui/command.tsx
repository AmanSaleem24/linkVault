'use client'

import { useState, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react'

interface CommandOverlayProps {
  children: ReactNode
  onClose: () => void
}

function CommandOverlay({ children, onClose }: CommandOverlayProps) {
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command box */}
      <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-12 bg-transparent text-[0.95rem] outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Scrollable list */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {children}
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-400 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function CommandGroup({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-2 py-1.5 text-xs font-medium text-slate-500">{heading}</div>
      <div>{children}</div>
    </div>
  )
}

function CommandItem({ onSelect, children }: { onSelect: () => void; children: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect()
      }}
      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors duration-100 text-slate-700 hover:bg-slate-50"
    >
      {children}
    </div>
  )
}

export { CommandOverlay, CommandGroup, CommandItem }
