'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CommandOverlay, CommandGroup, CommandItem } from '@/components/ui/command'
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

  // Load recent links when palette opens
  useEffect(() => {
    if (open) {
      setIsLoadingLinks(true)
      getLinksAction({ limit: 5 }).then((result) => {
        if (result.success) {
          setRecentLinks(result.data.links.slice(0, 5))
        }
        setIsLoadingLinks(false)
      })
    }
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
    <CommandOverlay onClose={() => setOpen(false)}>
      {/* Actions */}
      <CommandGroup heading="Actions">
        <CommandItem onSelect={() => handleNavigate('/link?create=true')}>
          <Plus className="size-4 text-slate-400" />
          <span>Create new link</span>
        </CommandItem>
        <CommandItem onSelect={() => handleNavigate('/analytics')}>
          <BarChart3 className="size-4 text-slate-400" />
          <span>View analytics</span>
        </CommandItem>
        <CommandItem onSelect={() => handleNavigate('/link')}>
          <Download className="size-4 text-slate-400" />
          <span>Download CSV</span>
        </CommandItem>
      </CommandGroup>

      {/* Navigation */}
      <CommandGroup heading="Navigation">
        <CommandItem onSelect={() => handleNavigate('/home')}>
          <Home className="size-4 text-slate-400" />
          <span>Home</span>
        </CommandItem>
        <CommandItem onSelect={() => handleNavigate('/link')}>
          <Link2 className="size-4 text-slate-400" />
          <span>All Links</span>
        </CommandItem>
        <CommandItem onSelect={() => handleNavigate('/analytics')}>
          <BarChart3 className="size-4 text-slate-400" />
          <span>Analytics</span>
        </CommandItem>
        <CommandItem onSelect={() => handleNavigate('/audit')}>
          <History className="size-4 text-slate-400" />
          <span>Activity log</span>
        </CommandItem>
      </CommandGroup>

      {/* Recent links */}
      {!isLoadingLinks && recentLinks.length > 0 && (
        <CommandGroup heading="Recent Links">
          {recentLinks.map((link) => (
            <CommandItem
              key={link.id}
              onSelect={() => handleNavigate(`/link/${link.id}`)}
            >
              <Search className="size-4 text-slate-400" />
              <span className="truncate">/{link.slug}</span>
              <span className="ml-auto text-xs text-slate-400 truncate max-w-50">
                {link.originalUrl}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {/* Settings */}
      <CommandGroup heading="Account">
        <CommandItem onSelect={() => handleNavigate('/settings')}>
          <Settings className="size-4 text-slate-400" />
          <span>Settings</span>
        </CommandItem>
        <CommandItem onSelect={handleSignOut}>
          <LogOut className="size-4 text-slate-400" />
          <span>Sign out</span>
        </CommandItem>
      </CommandGroup>
    </CommandOverlay>
  )
}
