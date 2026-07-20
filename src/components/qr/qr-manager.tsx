'use client'

import { useState } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Plus, Download, Trash2, QrCode as QrCodeIcon, Loader2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteQrCode } from '@/app/actions/qr'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QrManagerProps {
  qrCodes: Array<{
    id: string
    color: string
    bgColor: string
    style: string
    rawUrl: string | null
    link: { slug: string; originalUrl: string; clickCount: number } | null
  }>
  isPro: boolean
  qrLimit: number
  appUrl: string
}

export function QrManager({ qrCodes, isPro, qrLimit, appUrl }: QrManagerProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const limit = qrLimit
  const usage = qrCodes.length
  const reachedLimit = !isPro && usage >= limit

  const downloadImage = (id: string, name: string) => {
    const canvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement | null
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${name}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return
    setIsDeleting(id)
    const res = await deleteQrCode(id)
    setIsDeleting(null)
    if (res.success) {
      toast.success('QR code deleted')
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground">QR Codes</h1>
          <p className="text-sm text-slate-500 dark:text-muted-foreground">
            Manage your custom QR codes for easy sharing.
          </p>
        </div>

        <Button
          onClick={() => {
            if (reachedLimit) {
              toast.error('Limit reached. Upgrade to Pro.')
              return
            }
            router.push('/qr/create')
          }}
          disabled={reachedLimit}
          className="gap-2"
        >
          <Plus className="size-4" />
          Create QR Code
        </Button>
      </div>

      {!isPro && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-400">
            <QrCodeIcon className="size-4" />
            <span>
              {usage} / {limit} QR codes used
            </span>
          </div>
          {reachedLimit && (
            <span className="font-semibold text-amber-600 dark:text-amber-500">
              Limit reached. Upgrade to Pro for unlimited.
            </span>
          )}
        </div>
      )}

      {qrCodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-24 text-center dark:border-border dark:bg-card">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-muted">
            <QrCodeIcon className="size-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground">No QR codes yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
            Create your first QR code to easily share your links offline.
          </p>
          <Button
            onClick={() => {
              if (reachedLimit) {
                toast.error('Limit reached. Upgrade to Pro.')
                return
              }
              router.push('/qr/create')
            }}
            disabled={reachedLimit}
            variant="outline"
            className="mt-6 gap-2"
          >
            <Plus className="size-4" />
            Create your first QR Code
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr) => {
            const qrUrl = qr.link ? `${appUrl}/${qr.link.slug}` : (qr.rawUrl || '')
            const isRaw = !qr.link
            
            return (
              <div
                key={qr.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-border dark:bg-card"
              >
                <div className="flex items-center justify-center bg-slate-50 p-8 dark:bg-muted/30">
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-white dark:ring-0">
                    <QRCode
                      id={`qr-${qr.id}`}
                      value={qrUrl}
                      size={120}
                      fgColor={qr.color}
                      bgColor={qr.bgColor}
                      qrStyle={qr.style as 'squares' | 'dots'}
                      eyeRadius={qr.style === 'dots' ? 10 : 0}
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    {isRaw ? (
                      <>
                        <h4 className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-foreground">
                          <Globe className="size-4 text-slate-400" />
                          Raw URL
                        </h4>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-muted-foreground">
                          {qrUrl}
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className="font-semibold text-slate-900 dark:text-foreground">/{qr.link!.slug}</h4>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-muted-foreground">
                          {qr.link!.originalUrl}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-border">
                    <span className="text-xs font-medium text-slate-500 dark:text-muted-foreground">
                      {isRaw ? 'No tracking' : `${qr.link!.clickCount} scans`}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => downloadImage(qr.id, qr.link ? qr.link.slug : 'raw')}
                        title="Download PNG"
                      >
                        <Download className="size-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:text-red-600"
                        onClick={() => handleDelete(qr.id)}
                        disabled={isDeleting === qr.id}
                        title="Delete"
                      >
                        {isDeleting === qr.id ? (
                          <Loader2 className="size-4 animate-spin text-slate-400" />
                        ) : (
                          <Trash2 className="size-4 text-slate-500 hover:text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
