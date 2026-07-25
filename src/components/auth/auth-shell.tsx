'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuthShellProps {
  children: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-brand/30 selection:text-brand-300">
      {/* Left side: Form area */}
      <div className="flex w-full flex-col lg:w-[60%]">
        <div className="flex items-center justify-between px-10 pt-10 sm:px-14 mb-10">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-1.5">
            <Image src="/logo.svg" alt="LinkVault" width={40} height={40} className="rounded-md w-auto h-10" />
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-indigo-600 dark:text-indigo-500">Link</span><span className="text-foreground dark:text-white">Vault</span>
            </span>
          </Link>
          
          <ThemeToggle className="scale-95" />
        </div>

        <div className="flex flex-1 flex-col justify-center px-10 sm:px-14 lg:px-20 xl:px-28 py-12">
          <div className="w-full max-w-[480px]">
            {children}
          </div>
        </div>
      </div>

      {/* Right side: Full-bleed image */}
      <div className="hidden lg:flex lg:w-[40%] relative h-screen items-center justify-center bg-muted/30 dark:bg-background border-l border-border/50">
        <Image
          src="/signInSideBar.jpg"
          alt="LinkVault Sidebar"
          fill
          className="object-cover dark:invert dark:hue-rotate-180 dark:mix-blend-screen dark:opacity-80"
          priority
        />
        {/* Subtle radial gradient overlay to soften edges in dark mode */}
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_40%,rgba(19,20,23,0.8)_100%)] pointer-events-none" />
      </div>
    </div>
  )
}
