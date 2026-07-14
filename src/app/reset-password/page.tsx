'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetPasswordAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LinkIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out backdrop-blur-sm border-brand-200/50 shadow-xl shadow-brand-200/20 dark:shadow-brand-600/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Invalid reset link</CardTitle>
          <CardDescription>
            This password reset link is invalid or missing. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/forgot-password">
            <Button variant="outline">Request new link</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out backdrop-blur-sm border-brand-200/50 shadow-xl shadow-brand-200/20 dark:shadow-brand-600/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <CardTitle className="text-xl">Password reset!</CardTitle>
          <CardDescription>
            Your password has been updated successfully. You can now sign in with your new password.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login">
            <Button>Sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      token: token!,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const result = await resetPasswordAction(data)

    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error ?? 'Something went wrong')
    }
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out backdrop-blur-sm border-brand-200/50 shadow-xl shadow-brand-200/20 dark:shadow-brand-600/20">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <LinkIcon className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl">Set new password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full shadow-md active:scale-[0.98] transition-all" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting…
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-brand hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-400 underline-offset-4 hover:underline transition-colors">
          Back to login
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-brand-50 to-white dark:from-brand-600 dark:via-background dark:to-background px-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out backdrop-blur-sm border-brand-200/50 shadow-xl shadow-brand-200/20 dark:shadow-brand-600/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Loading…</CardTitle>
            </CardHeader>
          </Card>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
