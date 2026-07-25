'use client'

import { PRESET_DURATIONS, type ExpiryDuration } from '@/lib/validators'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

interface ExpirySelectorProps {
  value: ExpiryDuration
  onChange: (value: ExpiryDuration) => void
  customValue: string
  customUnit: 'm' | 'h'
  onCustomValueChange: (value: string) => void
  onCustomUnitChange: (unit: 'm' | 'h') => void
  disabled?: boolean
  label?: string
  className?: string
}

const PRESET_PILLS = PRESET_DURATIONS.filter(d => d.value !== null)
const UNIT_LABELS: Record<string, string> = { m: 'Min', h: 'Hrs' }

export function ExpirySelector({
  value,
  onChange,
  customValue,
  customUnit,
  onCustomValueChange,
  onCustomUnitChange,
  disabled = false,
  label = 'Expires After',
  className = '',
}: ExpirySelectorProps) {
  const isCustom = value === 'custom'

  return (
    <div className={className}>
      <label className="text-[0.8rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
        {label}
      </label>

      {/* Segmented pill buttons */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-muted/80 p-1.5">
        {PRESET_PILLS.map((preset) => {
          const isActive = value === preset.value
          return (
            <button
              key={preset.value as string}
              type="button"
              onClick={() => onChange(preset.value)}
              disabled={disabled}
              className={[
                'h-9 px-4 rounded-lg text-[0.85rem] font-semibold transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50',
                disabled && 'opacity-50 cursor-not-allowed',
              ].join(' ')}
            >
              {preset.label}
            </button>
          )
        })}
        {/* Custom pill */}
        <button
          type="button"
          onClick={() => onChange('custom')}
          disabled={disabled}
          className={[
            'h-9 px-4 rounded-lg text-[0.85rem] font-semibold transition-all duration-150 cursor-pointer',
            isCustom
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/50',
            disabled && 'opacity-50 cursor-not-allowed',
          ].join(' ')}
        >
          Custom
        </button>
      </div>

      {/* Custom value inputs */}
      {isCustom && (
        <div className="flex items-center gap-2 mt-3 animate-in fade-in duration-150">
          <input
            type="number"
            min="1"
            placeholder="Value"
            value={customValue}
            onChange={(e) => onCustomValueChange(e.target.value)}
            disabled={disabled}
            className="h-10 w-24 rounded-lg border border-border bg-card px-3 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50"
          />
          <DropdownMenu>
            <DropdownMenuTrigger disabled={disabled} className="h-10 items-center justify-between gap-1.5 rounded-lg border border-border bg-card pl-3 pr-2 text-[0.9rem] font-medium text-foreground shadow-sm transition-all hover:border-border focus:border-[var(--accent-brand)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-brand)]/15 disabled:opacity-50 inline-flex">
              {UNIT_LABELS[customUnit] ?? 'Hrs'}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-30 rounded-xl border border-border bg-popover p-1.5 shadow-lg shadow-black/20 ring-1 ring-white/8">
              {(['m', 'h'] as const).map((unit) => (
                <DropdownMenuItem
                  key={unit}
                  onClick={() => onCustomUnitChange(unit)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors cursor-pointer ${customUnit === unit ? 'bg-[var(--accent-brand)]/8 text-[var(--accent-brand)]' : 'text-foreground hover:bg-muted/50'}`}
                >
                  {UNIT_LABELS[unit]}
                  {customUnit === unit && (
                    <span className="size-1.5 rounded-full bg-[var(--accent-brand)]" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
