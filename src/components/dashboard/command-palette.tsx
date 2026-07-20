'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Home,
  Link2,
  BarChart3,
  Download,
  Settings,
  LogOut,
  Plus,
  Search,
  History,
} from 'lucide-react'
import { getLinksAction } from '@/app/actions/links.read'
import { signOutAction } from '@/app/actions/auth'

interface RecentLink {
  id: string
  slug: string
  originalUrl: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [recentLinks, setRecentLinks] = useState<RecentLink[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)
  const router = useRouter()
  const hasLoadedRef = useRef(false)

  // Load recent links when palette opens (only once per mount)
  useEffect(() => {
    if (!open) return
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    setIsLoadingLinks(true)
    getLinksAction({ limit: 5 }).then((result) => {
      if (result.success) {
        setRecentLinks(result.data.links.slice(0, 5))
      }
      setIsLoadingLinks(false)
    })
  }, [open])

  // Keyboard shortcut: Ctrl+K or Cmd+K to toggle, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleNavigate = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  const handleSignOut = async () => {
    setOpen(false)
    await signOutAction()
  }

  if (!open) return null

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-2xl">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleNavigate('/link?create=true')}>
            <Plus className="mr-2 size-4 text-brand-500" />
            <span>Create new link</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/analytics')}>
            <BarChart3 className="mr-2 size-4 text-emerald-500" />
            <span>View analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/link')}>
            <Download className="mr-2 size-4 text-sky-500" />
            <span>Download CSV</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate('/home')}>
            <Home className="mr-2 size-4 text-violet-500" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/link')}>
            <Link2 className="mr-2 size-4 text-brand-500" />
            <span>All Links</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/analytics')}>
            <BarChart3 className="mr-2 size-4 text-emerald-500" />
            <span>Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/audit')}>
            <History className="mr-2 size-4 text-amber-500" />
            <span>Activity log</span>
          </CommandItem>
        </CommandGroup>

        {!isLoadingLinks && recentLinks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Links">
              {recentLinks.map((link) => (
                <CommandItem
                  key={link.id}
                  onSelect={() => handleNavigate(`/link/${link.id}`)}
                >
                  <Search className="mr-2 size-4 text-indigo-500" />
                  <span className="truncate">/{link.slug}</span>
                  <span className="ml-auto text-xs text-slate-400 truncate max-w-[200px]">
                    {link.originalUrl}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => handleNavigate('/settings')}>
            <Settings className="mr-2 size-4 text-slate-600" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={handleSignOut}>
            <LogOut className="mr-2 size-4 text-rose-500" />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
