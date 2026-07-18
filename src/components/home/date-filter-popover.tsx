'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Calendar, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateFilter {
  preset: string | null
  from: string | null
  to: string | null
}

export interface DateFilterPopoverProps {
  dateFrom: string | null
  dateTo: string | null
  onApply: (from: string, to: string, preset?: string) => void
  onClear: () => void
  activeLabel?: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"]

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

// ─── Component ────────────────────────────────────────────────────────────────

export function DateFilterPopover({
  dateFrom, dateTo, onApply, onClear, activeLabel,
}: DateFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [localFrom, setLocalFrom] = useState<Date | null>(dateFrom ? new Date(dateFrom) : null)
  const [localTo, setLocalTo] = useState<Date | null>(dateTo ? new Date(dateTo) : null)
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  // Sync with external state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalFrom(dateFrom ? new Date(dateFrom) : null)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTo(dateTo ? new Date(dateTo) : null)
  }, [dateFrom, dateTo])

  const handlePreset = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getRange()
    setLocalFrom(new Date(range.from))
    setLocalTo(new Date(range.to))
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
    // format as YYYY-MM-DD
    const f = `${localFrom.getFullYear()}-${String(localFrom.getMonth() + 1).padStart(2, '0')}-${String(localFrom.getDate()).padStart(2, '0')}`
    const t = `${localTo.getFullYear()}-${String(localTo.getMonth() + 1).padStart(2, '0')}-${String(localTo.getDate()).padStart(2, '0')}`
    
    onApply(f, t)
    setOpen(false)
  }

  const handleDateSelect = (date: Date) => {
    if (activeInput === 'from') {
      setLocalFrom(date)
      if (!localTo || date > localTo) {
        setLocalTo(date)
      }
      setActiveInput('to')
    } else {
      setLocalTo(date)
      if (!localFrom || date < localFrom) {
        setLocalFrom(date)
      }
    }
  }

  const handleClear = () => {
    onClear()
    setLocalFrom(null)
    setLocalTo(null)
    setOpen(false)
  }

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear()
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ""
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
  }

  // Calendar Grid logic
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const prevMonthDays = getDaysInMonth(year, month - 1)
  
  const days: { date: Date; isCurrentMonth: boolean }[] = []
  
  // Previous month overflow
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    })
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    })
  }
  // Next month overflow
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    })
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
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
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="ml-1 rounded-full p-0.5 hover:bg-[#3D52A0]/10"
          >
            <X className="size-3" />
          </span>
        )}
        <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Content */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-2 w-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] ring-1 ring-slate-200/60 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
            
            {/* Mode tabs */}
            <div className="mb-4 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setMode('preset')}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-all duration-200",
                  mode === 'preset' ? "bg-white text-[#3D52A0] shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Quick select
              </button>
              <button
                onClick={() => setMode('custom')}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-all duration-200",
                  mode === 'custom' ? "bg-white text-[#3D52A0] shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Custom range
              </button>
            </div>

            {mode === 'preset' ? (
              <div className="flex flex-col gap-1 py-1">
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
              <div className="animate-in fade-in duration-300">
                {/* Inputs */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Calendar className={cn(
                      "absolute left-2.5 top-2.5 size-4 transition-colors", 
                      activeInput === 'from' ? "text-[#3D52A0]" : "text-slate-400"
                    )} />
                    <input
                      type="text"
                      readOnly
                      placeholder="mm/dd/yyyy"
                      value={formatDate(localFrom)}
                      onClick={() => setActiveInput('from')}
                      className={cn(
                        "w-full h-9 pl-9 pr-3 rounded-lg border text-[0.85rem] cursor-pointer outline-none transition-all duration-200",
                        activeInput === 'from' 
                          ? "border-[#3D52A0] ring-2 ring-[#3D52A0]/20 bg-white" 
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      )}
                    />
                    <label className="absolute -top-2 left-2 px-1 bg-white text-[0.65rem] font-semibold text-slate-400">From</label>
                  </div>
                  <div className="relative flex-1">
                    <Calendar className={cn(
                      "absolute left-2.5 top-2.5 size-4 transition-colors", 
                      activeInput === 'to' ? "text-[#3D52A0]" : "text-slate-400"
                    )} />
                    <input
                      type="text"
                      readOnly
                      placeholder="mm/dd/yyyy"
                      value={formatDate(localTo)}
                      onClick={() => setActiveInput('to')}
                      className={cn(
                        "w-full h-9 pl-9 pr-3 rounded-lg border text-[0.85rem] cursor-pointer outline-none transition-all duration-200",
                        activeInput === 'to' 
                          ? "border-[#3D52A0] ring-2 ring-[#3D52A0]/20 bg-white" 
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      )}
                    />
                    <label className="absolute -top-2 left-2 px-1 bg-white text-[0.65rem] font-semibold text-slate-400">To</label>
                  </div>
                </div>

                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                    className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500 hover:text-slate-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-[0.85rem] font-semibold text-slate-900">
                    {MONTH_NAMES[month]} {year}
                  </div>
                  <button 
                    onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                    className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500 hover:text-slate-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAY_HEADERS.map((day, i) => (
                    <div key={i} className="text-center text-[0.65rem] font-bold text-slate-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-1 gap-x-1 mb-4">
                  {days.map((dayObj, i) => {
                    const isSelectedFrom = isSameDay(localFrom, dayObj.date)
                    const isSelectedTo = isSameDay(localTo, dayObj.date)
                    
                    const isSelected = isSelectedFrom || isSelectedTo
                    const isTodayDate = isSameDay(today, dayObj.date)
                    
                    // Range highlighting
                    const isWithinRange = localFrom && localTo && dayObj.date > localFrom && dayObj.date < localTo
                    
                    return (
                      <div key={i} className="relative flex items-center justify-center">
                        {isWithinRange && (
                          <div className="absolute inset-0 bg-[#3D52A0]/10 rounded-sm" />
                        )}
                        <button
                          onClick={() => handleDateSelect(dayObj.date)}
                          className={cn(
                            "relative w-7 h-7 flex items-center justify-center rounded-full text-[0.8rem] transition-all duration-200",
                            !dayObj.isCurrentMonth && "text-slate-300",
                            dayObj.isCurrentMonth && !isSelected && !isWithinRange && "text-slate-700 hover:bg-slate-100",
                            dayObj.isCurrentMonth && !isSelected && isWithinRange && "text-slate-800 hover:bg-[#3D52A0]/20",
                            isSelected && "bg-[#3D52A0] text-white font-medium shadow-md shadow-[#3D52A0]/30 scale-105",
                            isTodayDate && !isSelected && "text-[#3D52A0] font-bold",
                          )}
                        >
                          {dayObj.date.getDate()}
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setLocalFrom(null)
                        setLocalTo(null)
                        setActiveInput('from')
                      }}
                      className="text-[0.75rem] font-medium text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => handleDateSelect(today)}
                      className="text-[0.75rem] font-medium text-[#3D52A0] hover:text-brand-500 transition-colors"
                    >
                      Today
                    </button>
                  </div>
                  <Button 
                    onClick={handleCustomApply}
                    size="sm"
                    className="h-8 px-4 bg-[#3D52A0] hover:bg-brand-500 text-white text-xs rounded-md shadow-sm"
                  >
                    Apply
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
