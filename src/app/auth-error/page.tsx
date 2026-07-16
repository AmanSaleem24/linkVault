import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration. Please try again in a moment.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  OAuthAccountNotLinked: 'This email is already associated with a different sign-in method.',
  Default: 'An unexpected error occurred. Please try again.',
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message = ERROR_MESSAGES[error ?? ''] ?? ERROR_MESSAGES.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-7 text-red-500" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-slate-900">
          Authentication Error
        </h1>
        {error && (
          <p className="mb-1 text-xs font-mono text-slate-400">Code: {error}</p>
        )}
        <p className="mb-8 text-sm text-slate-500">{message}</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl border border-[#23007A] bg-gradient-to-b from-[#3D00D1] to-[#2B0094] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-[#4300E6] hover:to-[#3100A8]"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
