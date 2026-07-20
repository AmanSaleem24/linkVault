'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signUpAction, googleSignInAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthField } from '@/components/auth/auth-field'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const newFieldErrors: { name?: string; email?: string; password?: string } = {}

    if (!name || name.length < 2) {
      newFieldErrors.name = 'Name must be at least 2 characters'
    }

    if (!email) {
      newFieldErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newFieldErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newFieldErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newFieldErrors.password = 'Password must contain at least 1 uppercase letter'
    } else if (!/(?=.*[0-9])/.test(password)) {
      newFieldErrors.password = 'Password must contain at least 1 number'
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      return
    }

    setLoading(true)

    const data = {
      name,
      email,
      password,
    }

    const result = await signUpAction(data)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? 'Something went wrong')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="mx-auto w-full max-w-md text-center p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900">
            Check your email
          </h1>
          <p className="mb-8 text-base text-[#555]">
            We&apos;ve sent a verification link to your email address. Click the link to activate your account.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full h-11 rounded-sm border-[#c4c7c5] text-[#2a2e30] font-semibold hover:bg-[#f4f5f5]">
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthShell>
      <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-slate-900">
        Create an account
      </h1>
      <p className="mb-10 text-base text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:text-brand-500 hover:underline transition-colors">
          Log in
        </Link>
      </p>

      <button
        type="button"
        onClick={() => googleSignInAction()}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-sm border-2 border-[#dadce0] bg-white text-[15px] font-medium text-slate-700 shadow-sm transition-all hover:border-[#d2e3fc] hover:bg-[#f8faff] hover:shadow-md active:scale-[0.98]"
      >
        <svg width="20" height="20" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4 my-2">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[13px] font-medium text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
        {error && (
          <div className="flex items-center gap-2 rounded-sm bg-destructive/10 px-4 py-3 text-[15px] font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <AuthField
          id="name"
          name="name"
          label="Full name"
          type="text"
          autoComplete="name"
          value={undefined}
          error={fieldErrors.name}
        />

        <AuthField
          id="email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <AuthField
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={fieldErrors.password}
          helperText="Min 8 chars, 1 uppercase, 1 number"
        />

        <Button
          type="submit"
          className="mt-2 h-12 w-full rounded-sm bg-brand text-[15px] font-semibold text-white shadow-lg hover:bg-brand-500 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account…
            </>
          ) : (
            'Sign up'
          )}
        </Button>
      </form>

      <p className="mt-8 text-[12px] leading-relaxed text-[#555]">
        By signing up with an account, you agree to LinkVault&apos;s{' '}
        <a href="#" className="underline hover:text-[#2a2e30]">Terms of Service</a>,{' '}
        <a href="#" className="underline hover:text-[#2a2e30]">Privacy Policy</a> and{' '}
        <a href="#" className="underline hover:text-[#2a2e30]">Acceptable Use Policy</a>.
      </p>
    </AuthShell>
  )
}
