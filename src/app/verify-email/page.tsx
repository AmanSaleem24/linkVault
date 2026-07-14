'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmailAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Suspense } from 'react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error')
        setErrorMessage('No verification token provided.')
        return
      }

      const result = await verifyEmailAction(token)

      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(result.error ?? 'Verification failed.')
      }
    }

    verify()
  }, [token])

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Verifying your email…</CardTitle>
          <CardDescription>
            Please wait while we confirm your email address.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <CardTitle className="text-xl">Email verified!</CardTitle>
          <CardDescription>
            Your account is now active. You can sign in to start using LinkVault.
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-xl">Verification failed</CardTitle>
        <CardDescription>
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-center gap-2">
        <Link href="/signup">
          <Button variant="outline">Sign up again</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Back to login</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 px-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Loading…</CardTitle>
            </CardHeader>
          </Card>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
