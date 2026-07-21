import { Globe, Sparkles, Server } from 'lucide-react'

export const metadata = {
  title: 'Custom Domains | LinkVault',
}

export default function CustomDomainsPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-6 pb-24">
      <div className="relative flex max-w-lg flex-col items-center text-center">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 -z-10 h-64 w-64 -translate-y-1/2 rounded-full bg-brand-400/20 blur-[80px] dark:bg-brand-400/10"></div>
        
        {/* Icon stack */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute size-24 animate-ping opacity-20 rounded-full bg-brand-400 dark:bg-brand-500"></div>
          <div className="relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100/50 shadow-sm ring-1 ring-brand-200/50 dark:from-brand-950/40 dark:to-brand-900/20 dark:ring-brand-800/30">
            <Globe className="size-10 text-brand-500 dark:text-brand-400" />
            <div className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-card dark:ring-border">
              <Server className="size-4 text-slate-400" />
            </div>
            <div className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-amber-100 shadow-sm ring-1 ring-amber-200/50 dark:bg-amber-900/40 dark:ring-amber-700/50">
              <Sparkles className="size-3.5 text-amber-500" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-foreground sm:text-4xl">
          Custom Domains
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-500 dark:text-muted-foreground">
          Brand your links with your own domain name. Replace <strong className="text-slate-700 dark:text-slate-300">link-vault-theta.vercel.app</strong> with your own website&apos;s domain to increase trust and click-through rates.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800/40 dark:bg-brand-950/30 dark:text-brand-300">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-brand-500"></span>
          </span>
          Coming soon
        </div>
      </div>
    </div>
  )
}
