'use client'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuthFieldProps {
  id: string
  name: string
  label: string
  type?: string
  autoComplete?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  helperText?: string
  inputClassName?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthField({
  id,
  name,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  inputClassName,
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`h-11 w-full rounded-sm border-2 bg-white px-4 text-[15px] text-slate-900 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.06)] hover:border-blue-400 focus:ring-4 focus:ring-brand/10 ${
          error ? 'border-red-500 focus:border-red-500' : 'border-white focus:border-brand'
        } ${inputClassName ?? ''}`}
      />
      {error && <span className="text-[13px] text-red-500">{error}</span>}
      {helperText && !error && (
        <div className="mt-1">
          <span className="text-[13px] text-slate-500">{helperText}</span>
        </div>
      )}
    </div>
  )
}
