'use client'

import { signOutAction } from '@/app/actions/auth'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

/**
 * AccountMenu — dropdown in the top navbar
 *
 * Layout (matches Bitly-style dropdown):
 *  1. Avatar + Name + Email
 *  2. Account ID + Free account label + Upgrade button
 *  3. Support, Terms links
 *  4. Sign out
 */
export function AccountMenu({
  name,
  email,
  isPro = false,
}: {
  name: string
  email: string
  isPro?: boolean
}) {
  const initial = name?.charAt(0).toUpperCase() ?? email?.charAt(0).toUpperCase() ?? '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-muted focus:outline-none">
        {/* Avatar circle */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-400 text-xs font-semibold text-white dark:bg-brand-300">
          {initial}
        </div>
        <span className="hidden max-w-[120px] truncate font-medium lg:inline">
          {name}
        </span>
        {/* Chevron */}
        <svg
          className="size-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        {/* ── Section 1: Avatar + Name + Email ──────────────────────────── */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white dark:bg-brand-400">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* ── Section 2: Account plan + Upgrade ─────────────────────────── */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">{isPro ? 'Pro account' : 'Free account'}</p>
              </div>
              {!isPro && (
                <Button
                  size="sm"
                  className="h-7 rounded-md bg-brand-400 px-3 text-xs font-semibold text-white hover:bg-brand-500 dark:bg-brand-300 dark:text-brand-600 dark:hover:bg-brand-200"
                  onClick={() => {
                    // Will be wired to billing/upgrade page later
                  }}
                >
                  Upgrade
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* ── Section 3: Links ──────────────────────────────────────────── */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer px-3 py-2 text-sm"
            onSelect={() => {
              // Will link to support page later
            }}
          >
            Support
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer px-3 py-2 text-sm"
            onSelect={() => {
              // Will link to terms page later
            }}
          >
            Terms
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* ── Section 4: Sign out ────────────────────────────────────────── */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => signOutAction()}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
