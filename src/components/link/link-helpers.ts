import { toast } from 'sonner'

export function copyToClipboard(text: string, label = 'Copied!') {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(label)
    }).catch(() => {
      fallbackCopy(text, label)
    })
  } else {
    fallbackCopy(text, label)
  }
}

function fallbackCopy(text: string, label: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy') // eslint-disable-next-line deprecation/deprecation
    toast.success(label)
  } catch {
    toast.error('Failed to copy — please copy manually')
  }
  document.body.removeChild(textarea)
}

export function truncateUrl(url: string) {
  try {
    const u = new URL(url)
    const full = u.hostname + u.pathname
    return full.length > 55 ? full.slice(0, 55) + '…' : full
  } catch {
    return url.length > 55 ? url.slice(0, 55) + '…' : url
  }
}

export function getLinkTitle(url: string) {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return 'Untitled'
  }
}
