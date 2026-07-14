'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signUpAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out text-center p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mb-8 text-muted-foreground">
            We&apos;ve sent a verification link to your email address. Click the link to activate your account.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full h-11">
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    )
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
            Create an account
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-brand hover:text-brand-500 underline-offset-4 hover:underline transition-colors"
            >
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="font-semibold text-foreground">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                className="h-11"
              />
            </div>

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
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="mt-4 h-11 w-full bg-brand hover:bg-brand-500 active:scale-[0.98] transition-all text-base"
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

      {/* Right side: Full-bleed image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/signInSideBar.jpg"
          alt="LinkVault"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
