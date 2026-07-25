'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

/** Subscribe that never fires — only used to force client-only rendering */
const subscribe = () => () => {}

function useIsMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,  // client: mounted
    () => false, // server: not mounted
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useIsMounted()

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        relative flex size-9 items-center justify-center rounded-lg border border-border
        bg-background text-muted-foreground
        transition-colors duration-150
        hover:bg-muted hover:text-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${className ?? ''}
      `}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4 transition-transform duration-200" />
        ) : (
          <Moon className="size-4 transition-transform duration-200" />
        )
      ) : (
        // SSR placeholder — same size, invisible, prevents layout shift
        <span className="size-4" aria-hidden />
      )}
    </button>
  )
}
