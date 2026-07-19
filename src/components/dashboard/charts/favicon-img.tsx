'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

export function FaviconImg({ url, size = 20 }: { url: string; size?: number }) {
  const [errored, setErrored] = useState(false)

  let hostname = ''
  try {
    hostname = new URL(url).hostname
  } catch {
    // ignore
  }

  if (!hostname || errored) {
    return (
      <div
        className="flex items-center justify-center rounded bg-slate-100 text-slate-400 shrink-0"
        style={{ width: size, height: size }}
      >
        <Globe className="size-3.5" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
      alt=""
      width={size}
      height={size}
      className="rounded shrink-0 object-contain"
      onError={() => setErrored(true)}
    />
  )
}
