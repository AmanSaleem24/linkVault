import Link from 'next/link'

export default async function DisabledPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-400 mb-1 whitespace-nowrap">/{slug}</p>
        <h1 className="text-3xl font-bold text-slate-900">This link is disabled</h1>
        <p className="mt-3 text-slate-500 max-w-sm">
          The owner has temporarily disabled this short link. It may become available again later.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-brand-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500"
      >
        Go to LinkVault
      </Link>
    </div>
  )
}
