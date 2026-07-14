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
    <div className="flex min-h-screen bg-background">
      {/* Left side: Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {/* Logo / Header */}
          <div className="mb-8 flex items-center gap-2 text-brand">
            <LinkIcon className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight">LinkVault</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
            Log in and start sharing
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-brand hover:text-brand-500 underline-offset-4 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* Social Logins could go here */}
          {/* <div className="mb-6 flex flex-col gap-3">
            <Button variant="outline" className="w-full">Continue with Google</Button>
          </div>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">OR</span>
            </div>
          </div> */}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {emailNotVerified && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                <MailWarning className="h-4 w-4 shrink-0" />
                Please verify your email before signing in. Check your inbox for the verification link.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="font-semibold text-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="font-semibold text-foreground">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-11"
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
              className="mt-2 h-11 w-full bg-brand hover:bg-brand-500 active:scale-[0.98] transition-all text-base"
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

      {/* Right side: Image showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-brand-50 p-12">
        <div className="flex w-full max-w-lg flex-col items-center animate-in fade-in zoom-in-95 duration-1000 ease-out">
          <div className="relative aspect-square w-full">
            <Image
              src="/signInSideBar.jpg"
              alt="Connect tools visualization"
              fill
              className="object-contain drop-shadow-xl"
              priority
            />
          </div>
          <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-brand-600">
            Secure, fast, and reliable linking.
          </h2>
        </div>
      </div>
    </div>
  )
}
