'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LinkIcon, Loader2, AlertCircle, MailWarning } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setEmailNotVerified(false)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const result = await loginAction(data)

    if (!result.success) {
      if (result.error === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true)
      } else {
        setError(result.error ?? 'Something went wrong')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side: Form */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Logo pinned top-left */}
        <div className="px-8 pt-8 sm:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-brand">
            <LinkIcon className="h-7 w-7" />
            <span className="text-2xl font-bold tracking-tight">LinkVault</span>
          </Link>
        </div>

        {/* Form centered vertically */}
        <div className="flex flex-1 items-center px-8 sm:px-12 lg:px-20 xl:px-28">
          <div className="w-full max-w-md">
            <h1 className="mb-1 text-[28px] font-bold leading-tight tracking-tight text-foreground">
              Log in and start sharing
            </h1>
            <p className="mb-10 text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-brand hover:text-brand-500 underline-offset-4 hover:underline transition-colors"
              >
                Sign up
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {emailNotVerified && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-600">
                  <MailWarning className="h-4 w-4 shrink-0" />
                  Please verify your email before signing in.
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-11 rounded-md border-border bg-transparent shadow-none focus-visible:border-brand focus-visible:ring-0"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-md border-border bg-transparent shadow-none focus-visible:border-brand focus-visible:ring-0"
                />
              </div>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-brand hover:text-brand-500 underline-offset-4 hover:underline transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-md bg-brand hover:bg-brand-500 active:scale-[0.99] transition-all text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in…
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side: Image on soft background */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-brand-50">
        <div className="relative w-[80%] aspect-square">
          <Image
            src="/signInSideBar.jpg"
            alt="LinkVault"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  )
}
