'use client'

import Image from 'next/image'
import Link from 'next/link'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuthShellProps {
  children: React.ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side: Form area */}
      <div className="flex w-full flex-col lg:w-[60%]">
        <div className="px-10 pt-10 sm:px-14">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.png" alt="LinkVault" width={32} height={32} className="rounded-md" />
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">LinkVault</span>
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center px-10 sm:px-14 lg:px-20 xl:px-28 py-12">
          <div className="w-full max-w-[480px]">
            {children}
          </div>
        </div>
      </div>

      {/* Right side: Full-bleed image */}
      <div className="hidden lg:block lg:w-[40%] relative h-screen">
        <Image
          src="/signInSideBar.jpg"
          alt="LinkVault Sidebar"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}
