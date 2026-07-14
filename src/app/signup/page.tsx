'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signUpAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { LinkIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
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
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-600">
            Check your email
          </h1>
          <p className="mb-8 text-muted-foreground">
            We&apos;ve sent a verification link to your email address. Click the link to activate your account.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full h-12 rounded-full">
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side: Form */}
      <div className="flex w-full flex-col bg-white lg:w-1/2">
        {/* Logo pinned top-left */}
        <div className="px-10 pt-10 sm:px-14">
          <Link href="/" className="inline-flex items-center gap-2 text-brand">
            <LinkIcon className="h-7 w-7" />
            <span className="text-2xl font-bold tracking-tight">LinkVault</span>
          </Link>
        </div>

        {/* Form centered vertically */}
        <div className="flex flex-1 items-center px-10 sm:px-14 lg:px-20 xl:px-28">
          <div className="w-full max-w-[420px]">
            <h1 className="mb-1.5 text-[28px] font-bold leading-tight tracking-tight text-brand-600">
              Create an account
            </h1>
            <p className="mb-10 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-brand hover:text-brand-500 underline-offset-4 hover:underline transition-colors"
              >
                Log in
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-7">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-sm font-semibold text-foreground">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  className="h-10 w-full border-b-2 border-border bg-transparent text-base outline-none transition-colors focus:border-brand placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-10 w-full border-b-2 border-border bg-transparent text-base outline-none transition-colors focus:border-brand placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="h-10 w-full border-b-2 border-border bg-transparent text-base outline-none transition-colors focus:border-brand placeholder:text-muted-foreground/50"
                />
              </div>

              <Button
                type="submit"
                className="mt-2 h-12 w-full rounded-full bg-brand hover:bg-brand-500 active:scale-[0.98] transition-all text-base font-semibold shadow-md"
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
          </div>
        </div>
      </div>

      {/* Right side: Full-bleed image on matching bg */}
      <div className="hidden lg:block lg:w-1/2 relative bg-white">
        <Image
          src="/signInSideBar.jpg"
          alt="LinkVault"
          fill
          className="object-contain p-8"
          priority
        />
      </div>
    </div>
  )
}
