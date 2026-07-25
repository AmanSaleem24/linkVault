'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Link2, BarChart3, Settings, Plus, ChevronLeft, ChevronRight, QrCode, History, Globe, CreditCard } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

/**
 * Sidebar — persistent, collapsible navigation for the dashboard.
 */

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  disabled?: boolean
  divider?: boolean
  badge?: string
}

const navItems: NavItem[] = [
  { href: '/home', label: 'Overview', icon: Home },
  { href: '/link', label: 'All links', icon: Link2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/qr', label: 'QR Codes', icon: QrCode },
  { href: '/audit', label: 'Activity', icon: History, divider: true },
  { href: '/domains', label: 'Custom domains', icon: Globe },
  { href: '/billing', label: 'Billing', icon: CreditCard, divider: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isPro: _isPro = false }: { isPro?: boolean }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`
        relative hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground
        transition-[width] duration-200 ease-in-out md:flex md:flex-col
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* ── Collapse Toggle (Floating) ─────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`
          absolute -right-3.5 top-6 z-10 flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-sm
          transition-colors hover:bg-sidebar-accent hover:text-foreground
        `}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <div className="flex h-16 items-center px-5">
        {!collapsed ? (
          <Link href="/home" className="flex items-center gap-1.5">
            <Image src="/logo.svg" alt="LinkVault" width={40} height={40} className="rounded-md w-auto h-10" />
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-[var(--accent-brand)] dark:text-[var(--accent-brand)]">Link</span><span className="text-foreground">Vault</span>
            </span>
          </Link>
        ) : (
          <Link href="/home" className="mx-auto flex items-center justify-center">
            <Image src="/logo.svg" alt="LinkVault" width={48} height={48} className="rounded-md w-auto h-12" />
          </Link>
        )}
      </div>

      {/* ── Create new button ──────────────────────────────────────────── */}
      <div className={`pb-6 pt-2 ${collapsed ? 'px-2' : 'px-4'}`}>
        {collapsed ? (
          <Link href="/links/new" title="Create new">
            <Button
              size="icon"
              className="mx-auto flex size-10 rounded-md bg-[var(--accent-brand)] text-white shadow-sm hover:bg-[var(--accent-brand-hover)] dark:bg-[var(--accent-brand)] dark:hover:bg-[var(--accent-brand-hover)]"
            >
              <Plus className="size-5" />
            </Button>
          </Link>
        ) : (
          <Link href="/links/new" className="block">
            <Button
              className="h-10 w-full rounded-md bg-[var(--accent-brand)] text-[0.95rem] font-semibold text-white shadow-sm hover:bg-[var(--accent-brand-hover)]"
            >
              Create new
            </Button>
          </Link>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto [&::-webkit-scrollbar]:hidden ${collapsed ? 'px-2' : 'px-3'}`}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <div key={item.href}>
              {item.divider && (
                <div className="mx-2 my-3 h-px bg-sidebar-border" />
              )}

              {item.disabled ? (
                <span
                  title={collapsed ? item.label : undefined}
                  className={`
                    flex cursor-not-allowed items-center rounded-md text-[0.93rem] font-medium text-foreground dark:text-muted-foreground
                    ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                  `}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[0.7rem] font-medium text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </span>
              ) : (
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group relative flex items-center rounded-md text-[0.93rem] font-medium
                    transition-colors duration-150
                    ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand)] dark:bg-[var(--accent-brand-subtle)] dark:text-[var(--accent-brand)]'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }
                  `}
                >
                  {/* Active indicator bar - inside the button */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent-brand)]" />
                  )}
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[0.7rem] font-medium text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Cmd+K hint */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              // Dispatch a custom event to open the palette
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
            }}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-sidebar-accent px-3 py-2 text-xs text-muted-foreground hover:border-border-strong hover:bg-sidebar-accent/80 transition-colors"
          >
            <span>Command palette</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
    </aside>
  )
}

