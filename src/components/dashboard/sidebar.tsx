'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Link2, BarChart3, Settings, Plus, ChevronLeft, ChevronRight, QrCode, History, Globe, CreditCard } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative hidden shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col"
    >
      {/* ── Collapse Toggle (Floating) ─────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-6 z-10 flex size-7 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-sm transition-colors hover:bg-sidebar-accent hover:text-foreground"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <ChevronLeft className="size-4" />
        </motion.div>
      </motion.button>

      {/* ── Header / Logo ──────────────────────────────────────────────── */}
      <motion.div 
        className="flex h-16 items-center"
        animate={{ 
          paddingLeft: collapsed ? 0 : 20,
          paddingRight: collapsed ? 0 : 20,
        }}
      >
        <Link href="/home" className={`flex items-center gap-2 overflow-hidden w-full ${collapsed ? 'justify-center' : 'justify-start'}`}>
          <motion.div
            layout
            className="flex items-center justify-center shrink-0"
            animate={{ 
              scale: collapsed ? 1.3 : 1,
              x: 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Image src="/logo.svg" alt="LinkVault" width={40} height={40} className="rounded-md w-auto h-10" />
          </motion.div>

          <AnimatePresence mode="popLayout">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="text-2xl font-extrabold tracking-tight whitespace-nowrap"
              >
                <span className="text-[var(--accent-brand)] dark:text-[var(--accent-brand)]">Link</span><span className="text-foreground">Vault</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </motion.div>

      {/* ── Create new button ──────────────────────────────────────────── */}
      <motion.div 
        layout
        className="pb-6 pt-2 px-4 flex justify-center"
      >
        <motion.div
          animate={{ width: collapsed ? 40 : '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative h-10 overflow-hidden rounded-md shadow-sm"
        >
          <Link href="/links/new" className="block w-full h-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {collapsed ? (
                <motion.div
                  key="plus-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center bg-[var(--accent-brand)] text-white hover:bg-[var(--accent-brand-hover)]"
                >
                  <Plus className="size-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="text-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 flex items-center justify-center bg-[var(--accent-brand)] text-[0.95rem] font-semibold text-white hover:bg-[var(--accent-brand-hover)] whitespace-nowrap"
                >
                  Create new
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <motion.nav 
        className="flex flex-1 flex-col gap-1 overflow-y-auto [&::-webkit-scrollbar]:hidden px-3"
        animate={{ paddingLeft: collapsed ? 12 : 12, paddingRight: collapsed ? 12 : 12 }}
      >
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
                  className={`flex cursor-not-allowed items-center rounded-md text-[0.93rem] font-medium text-foreground dark:text-muted-foreground ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}
                >
                  <Icon className="size-5 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center w-full whitespace-nowrap overflow-hidden"
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[0.7rem] font-medium text-muted-foreground">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </span>
              ) : (
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex items-center rounded-md text-[0.93rem] font-medium transition-colors duration-150 ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'} ${isActive ? 'bg-[var(--accent-brand-subtle)] text-[var(--accent-brand)] dark:bg-[var(--accent-brand-subtle)] dark:text-[var(--accent-brand)]' : 'text-sidebar-foreground hover:bg-sidebar-accent'}`}
                >
                  {/* Active indicator bar - inside the button */}
                  {isActive && (
                    <motion.span 
                      layoutId="activeNavIndicator"
                      className="absolute left-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent-brand)]" 
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <motion.div
                    layout="position"
                    className="flex items-center justify-center shrink-0"
                  >
                    <Icon className="size-5" />
                  </motion.div>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="flex items-center w-full whitespace-nowrap overflow-hidden"
                      >
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[0.7rem] font-medium text-muted-foreground">
                            {item.badge}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              )}
            </div>
          )
        })}
      </motion.nav>

      {/* ── Cmd+K hint ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 overflow-hidden"
          >
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
              }}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-sidebar-accent px-3 py-2 text-xs text-muted-foreground hover:border-border-strong hover:bg-sidebar-accent/80 transition-colors"
            >
              <span className="whitespace-nowrap">Command palette</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}

