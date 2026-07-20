'use client'

import { Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AliasInputProps {
  alias: string
  setAlias: (v: string) => void
  aliasStatus: 'idle' | 'checking' | 'available' | 'taken'
  setAliasStatus: (s: 'idle' | 'checking' | 'available' | 'taken') => void
  aliasError: string | null
  onCheckAlias: (value: string) => void
  disabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AliasInput({
  alias,
  setAlias,
  aliasStatus,
  setAliasStatus,
  aliasError,
  onCheckAlias,
  disabled,
}: AliasInputProps) {
  return (
    <div className="flex-1 space-y-2">
      <label className="text-[0.95rem] font-semibold text-slate-800 flex items-center gap-2">
        <Sparkles className="size-4.5 text-[#2B0094]" />
        Custom Alias <span className="text-slate-400 font-normal">(Optional)</span>
      </label>
      <div className="relative flex h-12.5 items-center">
        <span className="flex h-full items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 pl-4 pr-1 text-[0.95rem] font-medium text-slate-500">
          /
        </span>
        <input
          type="text"
          placeholder="my-portfolio"
          value={alias}
          onChange={(e) => {
            setAlias(e.target.value)
            if (aliasStatus !== 'idle') setAliasStatus('idle')
          }}
          onBlur={() => onCheckAlias(alias)}
          disabled={disabled}
          className="w-full h-full rounded-r-xl border border-slate-200 bg-white px-3 text-[0.95rem] text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[#2B0094] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {alias.length > 0 && aliasStatus !== 'taken' && (
          <CheckCircle2 className="absolute right-3 top-1/2 size-4.5 -translate-y-1/2 text-green-500" strokeWidth={2.5} />
        )}
      </div>
      {aliasStatus === 'checking' && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] text-slate-500">
          <Loader2 className="size-3 animate-spin" /> Checking availability...
        </p>
      )}
      {aliasStatus === 'available' && alias.length > 0 && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] font-medium text-green-600">
          <CheckCircle2 className="size-3.5" /> This alias is available
        </p>
      )}
      {aliasStatus === 'taken' && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500">
          <XCircle className="size-3.5" /> {aliasError}
        </p>
      )}
    </div>
  )
}
