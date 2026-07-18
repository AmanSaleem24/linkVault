'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'
import { FaWhatsapp, FaFacebook, FaInstagram, FaXTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa6'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ShareDialogProps {
  url: string
  title: string
  children: React.ReactNode
}

export function ShareDialog({ url, title, children }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const platforms = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: '#25D366',
      href: `https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'Instagram',
      icon: FaInstagram,
      color: 'url(#ig-grad)',
      href: `https://instagram.com/` // Instagram doesn't have a direct share URL, but kept for visual parity
    },
    {
      name: 'X',
      icon: FaXTwitter,
      color: 'black',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: '#0A66C2',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    }
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden gap-0 border-slate-200 shadow-xl bg-white">
        <DialogHeader className="p-8 pb-2">
          <DialogTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">Share your LinkVault Link</DialogTitle>
        </DialogHeader>
        
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <linearGradient id="ig-grad" x1="2%" y1="84%" x2="98%" y2="16%">
            <stop offset="0%" stopColor="#f09433"/>
            <stop offset="25%" stopColor="#e6683c"/>
            <stop offset="50%" stopColor="#dc2743"/>
            <stop offset="75%" stopColor="#cc2366"/>
            <stop offset="100%" stopColor="#bc1888"/>
          </linearGradient>
        </svg>

        <div className="p-8 pt-6 min-w-0">
          <div className="flex w-full items-center justify-between mb-10 pb-4">
            {platforms.map((platform) => {
              const Icon = platform.icon
              return (
                <div key={platform.name} className="flex flex-col items-center gap-2.5 shrink-0 snap-start">
                  <a
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-[68px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    title={`Share on ${platform.name}`}
                  >
                  <Icon size={32} style={{ fill: platform.color }} />
                </a>
                  <span className="text-[13px] font-medium text-slate-600">{platform.name}</span>
                </div>
              )
            })}
          </div>

          <div className="flex w-full min-w-0 items-center justify-between rounded-xl border border-slate-300 bg-white p-1.5 pl-5 shadow-sm transition-colors hover:border-slate-400">
            <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-slate-700 pr-4">{url}</span>
            <button 
              onClick={handleCopy} 
              className={`shrink-0 rounded-lg px-6 py-2.5 text-sm font-bold transition-colors ${copied ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F0F2F5] text-slate-800 hover:bg-[#E4E6EB]'}`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
