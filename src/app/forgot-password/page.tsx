'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '@/app/actions/auth'
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
import { LinkIcon, Loader2, MailCheck, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const newFieldErrors: { email?: string } = {}
    
    if (!email) {
      newFieldErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newFieldErrors.email = 'Please enter a valid email address'
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors)
      return
    }

    setLoading(true)

    const data = {
      email,
    }

    const result = await forgotPasswordAction(data)

    if (result.success) {
      setSent(true)
    } else {
      setError(result.error ?? 'Something went wrong')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-brand-50 to-white dark:from-brand-600 dark:via-background dark:to-background px-4">
        <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out backdrop-blur-sm border-brand-200/50 shadow-xl shadow-brand-200/20 dark:shadow-brand-600/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <MailCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              If an account exists with that email, we&apos;ve sent a password reset link. The link expires in 15 minutes.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href="/login">
              <Button variant="outline">Back to login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-brand-50 to-white dark:from-brand-600 dark:via-background dark:to-background px-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out backdrop-blur-sm border-brand-200/50 shadow-xl shadow-brand-200/20 dark:shadow-brand-600/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <LinkIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {fieldErrors.email && <span className="text-[13px] text-red-500">{fieldErrors.email}</span>}
            </div>

            <Button type="submit" className="w-full shadow-md active:scale-[0.98] transition-all" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="ml-1 font-medium text-brand hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-400 underline-offset-4 hover:underline transition-colors">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
