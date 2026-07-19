'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Link2, BarChart3, Settings, Plus, ChevronLeft, ChevronRight, QrCode, FileText, FolderOpen, Globe, Blocks, History } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
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
  { href: '/home', label: 'Home', icon: Home },
  { href: '/link', label: 'Links', icon: Link2 },
  { href: '/qr', label: 'QR Codes', icon: QrCode, disabled: true, badge: 'Try it' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/audit', label: 'Activity', icon: History, divider: true },
  { href: '/domains', label: 'Custom domains', icon: Globe, disabled: true },
  { href: '/settings', label: 'Settings', icon: Settings, disabled: true, divider: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`
        relative hidden shrink-0 border-r border-sidebar-border bg-white text-sidebar-foreground dark:bg-sidebar
        transition-[width] duration-200 ease-in-out md:flex md:flex-col
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* ── Collapse Toggle (Floating) ─────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`
          absolute -right-3.5 top-6 z-10 flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-white text-muted-foreground shadow-sm
          transition-colors hover:bg-gray-50 hover:text-foreground dark:bg-sidebar dark:hover:bg-sidebar-accent
        `}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      {/* ── Logo row ─────────────────────────────────── */}
      <div className="flex h-16 items-center px-5">
        {!collapsed ? (
          <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#FF6C37] dark:text-[#FF6C37]">
            {/* Simple logo approximation */}
            <div className="flex size-7 items-center justify-center rounded-full border-2 border-[#FF6C37] font-serif text-sm">
              b
            </div>
            LinkVault
          </span>
        ) : (
          <div className="mx-auto flex size-7 items-center justify-center rounded-full border-2 border-[#FF6C37] font-serif text-sm font-extrabold text-[#FF6C37]">
            b
          </div>
        )}
      </div>

      {/* ── Create new button ──────────────────────────────────────────── */}
      <div className={`pb-6 pt-2 ${collapsed ? 'px-2' : 'px-4'}`}>
        {collapsed ? (
          <Link href="/links/new" title="Create new">
            <Button
              size="icon"
              className="mx-auto flex size-10 rounded-md bg-[#2B0094] text-white shadow-sm hover:bg-[#1f006b] dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <Plus className="size-5" />
            </Button>
          </Link>
        ) : (
          <Link href="/links/new" className="block">
            <Button
              className="h-10 w-full rounded-md bg-[#2B0094] text-[0.95rem] font-semibold text-white shadow-sm hover:bg-[#1f006b] dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              Create new
            </Button>
          </Link>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className={`flex flex-1 flex-col gap-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {navItems.map((item, index) => {
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
                    flex cursor-not-allowed items-center rounded-md text-[0.93rem] font-medium text-slate-900 dark:text-muted-foreground
                    ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
                  `}
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[0.7rem] font-medium text-slate-500">
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
                      ? 'bg-[#ECEEFE] text-[#2B0094] dark:bg-brand-400/20 dark:text-brand-300'
                      : 'text-slate-900 hover:bg-slate-100 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/50'
                    }
                  `}
                >
                  {/* Active indicator bar - inside the button */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-r-full bg-[#2B0094] dark:bg-brand-300" />
                  )}
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
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
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <span>Command palette</span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
    </aside>
  )
}

