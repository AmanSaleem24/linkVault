'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signUpAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2, LinkIcon } from 'lucide-react'

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
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
            Check your email
          </h1>
          <p className="mb-8 text-[#555]">
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
    <div className="flex min-h-screen bg-white">
      {/* Left side: Form */}
      <div className="flex w-full flex-col lg:w-[60%]">
        <div className="px-10 pt-10 sm:px-14">
          <Link href="/" className="inline-flex items-center gap-2 text-brand">
            <LinkIcon className="h-7 w-7" />
            <span className="text-2xl font-bold tracking-tight">LinkVault</span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center px-10 sm:px-14 lg:px-20 xl:px-28 py-12">
          <div className="w-full max-w-[480px]">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
              Create an account
            </h1>
            <p className="mb-10 text-[15px] text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-brand hover:text-brand-500 hover:underline transition-colors"
              >
                Log in
              </Link>
            </p>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
              {error && (
                <div className="flex items-center gap-2 rounded-sm bg-destructive/10 px-4 py-3 text-[15px] font-medium text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-[15px] font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={`h-11 w-full rounded-sm border-2 bg-white px-4 text-[15px] text-slate-900 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.06)] hover:border-blue-400 focus:ring-4 focus:ring-brand/10 ${
                    fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-white focus:border-brand'
                  }`}
                />
                {fieldErrors.name && <span className="text-[13px] text-red-500">{fieldErrors.name}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-[15px] font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`h-11 w-full rounded-sm border-2 bg-white px-4 text-[15px] text-slate-900 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.06)] hover:border-blue-400 focus:ring-4 focus:ring-brand/10 ${
                    fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-white focus:border-brand'
                  }`}
                />
                {fieldErrors.email && <span className="text-[13px] text-red-500">{fieldErrors.email}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-[15px] font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className={`h-11 w-full rounded-sm border-2 bg-white px-4 text-[15px] text-slate-900 outline-none transition-all shadow-[0_0_10px_rgba(0,0,0,0.06)] hover:border-blue-400 focus:ring-4 focus:ring-brand/10 ${
                    fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-white focus:border-brand'
                  }`}
                />
                <div className="mt-1">
                  <span className="text-[13px] text-slate-500">Min 8 chars, 1 uppercase, 1 number</span>
                </div>
              </div>

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
          </div>
        </div>
      </div>

      {/* Right side: Simple full-bleed image */}
      <div className="hidden lg:block lg:w-[40%] relative h-screen">
        <Image
          src="/signInSideBar.jpg"
          alt="LinkVault Sidebar"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
