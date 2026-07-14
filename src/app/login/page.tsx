'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <LinkIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your LinkVault account
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

            {emailNotVerified && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                <MailWarning className="h-4 w-4 shrink-0" />
                Please verify your email before signing in. Check your inbox for the verification link.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="ml-1 font-medium text-foreground underline-offset-4 hover:underline">
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
