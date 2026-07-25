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
        transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:flex md:flex-col
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

      <div className="flex h-16 w-full items-center justify-center overflow-hidden">
        <Link href="/home" className="flex w-full items-center">
          <div className={`relative shrink-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'size-11 mx-auto' : 'size-9 ml-5'}`}>
            <Image 
              src="/logo.svg" 
              alt="LinkVault" 
              fill
              className="rounded-md object-contain"
            />
          </div>
          <span className={`font-extrabold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'w-0 opacity-0 ml-0 text-[0px]' : 'w-[120px] opacity-100 ml-1.5 text-2xl'}`}>
            <span className="text-[var(--accent-brand)] dark:text-[var(--accent-brand)]">Link</span><span className="text-foreground">Vault</span>
          </span>
        </Link>
      </div>

      {/* ── Create new button ──────────────────────────────────────────── */}
      <div className={`pb-6 pt-2 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'px-2.5' : 'px-4'}`}>
        <Link href="/links/new" className="block w-full">
          <Button
            className={`w-full bg-[var(--accent-brand)] text-white shadow-sm hover:bg-[var(--accent-brand-hover)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden p-0 hover:scale-[1.02] active:scale-[0.98]
              ${collapsed ? 'h-11 rounded-xl' : 'h-10 rounded-md'}
            `}
          >
            <div className={`flex w-full h-full items-center transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'justify-center gap-0' : 'justify-center gap-2'}`}>
              <Plus className={`shrink-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'size-6' : 'size-5'}`} />
              <span className={`font-semibold whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'w-0 opacity-0' : 'w-[84px] opacity-100 text-[0.95rem]'}`}>
                Create new
              </span>
            </div>
          </Button>
        </Link>
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
                    className={`
                      flex cursor-not-allowed items-center rounded-md text-[0.93rem] font-medium text-foreground dark:text-muted-foreground transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
                      ${collapsed ? 'justify-center gap-0 px-0 py-2.5' : 'justify-start gap-3 px-3 py-2.5'}
                    `}
                  >
                    <Icon className="size-5 shrink-0" />
                    <div className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[0.7rem] font-medium text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`
                      group relative flex items-center rounded-md text-[0.93rem] font-medium
                      transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden
                      ${collapsed ? 'justify-center gap-0 px-0 py-2.5' : 'justify-start gap-3 px-3 py-2.5'}
                      ${isActive
                        ? 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand)] dark:bg-[var(--accent-brand-subtle)] dark:text-[var(--accent-brand)]'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:scale-[1.01]'
                      }
                    `}
                  >
                    {/* Active indicator bar - inside the button */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent-brand)] transition-transform duration-300" />
                    )}
                    <Icon className="size-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <div className={`flex items-center overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[0.7rem] font-medium text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </div>
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

