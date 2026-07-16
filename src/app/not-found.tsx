import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <p
          className="font-mono text-7xl font-bold tracking-tight"
          style={{ color: 'var(--color-brand-400)' }}
        >
          404
        </p>
        <h1
          className="mt-4 text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--color-brand-600)' }}
        >
          This link doesn&rsquo;t exist
        </h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
          The short link you&rsquo;re looking for may have been removed, disabled, or never
          existed. Double-check the URL and try again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--color-brand-400)' }}
        >
          Go to LinkVault
        </Link>
      </div>
    </div>
  )
}

export const metadata = {
  title: '404 — Link Not Found',
}
