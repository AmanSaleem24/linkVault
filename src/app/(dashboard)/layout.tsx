import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AccountMenu } from '@/components/dashboard/account-menu'
import { CommandPalette } from '@/components/dashboard/command-palette'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { getCurrentUserSubscription, isPro as checkIsPro } from '@/lib/plan'

/**
 * (dashboard) Route Group Layout
 *
 * This layout wraps all authenticated pages (/home, /link, /link/[id], etc.)
 * without adding a "/dashboard" segment to the URL.
 *
 * It provides:
 *  1. A server-side auth check — unauthenticated visitors are redirected to /login
 *  2. A persistent sidebar (Bitly-style) with navigation links
 *  3. A top navbar with search bar and account dropdown
 *  4. Geist font family scoped to dashboard pages
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const user = session.user
  let userIsPro = user.role === 'admin'
  if (!userIsPro) {
    const subscription = await getCurrentUserSubscription()
    userIsPro = checkIsPro(subscription)
  }
  const isPro = userIsPro

  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable} flex h-full min-h-screen font-[family-name:var(--font-geist-sans)]`}>
      {/* ── Sidebar (client component for active-link highlighting) ──────── */}
      <Sidebar isPro={isPro} />

      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Top Navbar ──────────────────────────────────────────────────── */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 md:px-6 dark:bg-background">
          {/* Mobile: logo (sidebar is hidden on mobile) */}
          <span className="text-lg font-bold tracking-tight text-brand-400 dark:text-brand-300 md:hidden">
            LinkVault
          </span>

          {/* Search bar (desktop) */}
          <div className="hidden md:flex md:flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search links..."
                className="h-10 w-full rounded-sm border border-input bg-white pl-10 pr-4 text-[0.95rem] text-foreground placeholder:text-muted-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 dark:bg-muted/40"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-sm border border-border bg-muted/50 px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground shadow-sm lg:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right side: mobile search + Plan badge + Account dropdown */}
          <div className="flex items-center gap-3">
            <button className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted md:hidden">
              <Search className="size-5" />
            </button>

            {isPro ? (
              <span className="hidden rounded bg-[#ECEEFE] px-3 py-1.5 text-[0.75rem] font-bold text-[#2B0094] dark:bg-brand-400/20 dark:text-brand-300 md:flex">Pro</span>
            ) : (
              <Link href="/pricing" className="hidden md:block">
                <Button className="h-10 bg-[#ECEEFE] px-5 text-[0.95rem] font-semibold text-[#2B0094] shadow-none hover:bg-[#e0e4fd] dark:bg-brand-400/20 dark:text-brand-300">
                  Upgrade
                </Button>
              </Link>
            )}

            <AccountMenu
              name={user.name ?? 'User'}
              email={user.email ?? ''}
              isPro={isPro}
            />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#F4F6FA] dark:bg-background">
          {children}
        </main>
      </div>

      {/* Command palette — rendered at root level for keyboard shortcut */}
      <CommandPalette />
    </div>
  )
}
