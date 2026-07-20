'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getCurrentUserSubscription, isPro } from '@/lib/plan'
import { FREE_TIER_LIMITS } from '@/lib/config'
import { createLinkAction } from './links.create'

const qrSchema = z.object({
  mode: z.enum(['new', 'existing']),
  linkId: z.string().cuid().optional(),
  rawUrl: z.string().url().optional(),
  alias: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format'),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid background color format'),
  style: z.enum(['squares', 'dots']),
  utmSource: z.string().optional().nullable(),
  utmMedium: z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
})

export async function getQrCodes() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const qrCodes = await prisma.qrCode.findMany({
      where: { userId: session.user.id },
      include: {
        link: {
          select: {
            slug: true,
            originalUrl: true,
            clickCount: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: qrCodes }
  } catch (error) {
    console.error('[qr.get]', error)
    return { success: false, error: 'Failed to fetch QR codes' }
  }
}

export async function createQrCode(data: z.infer<typeof qrSchema>) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  const parsed = qrSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: 'Invalid data' }
  }

  const { mode, linkId, rawUrl, alias, color, bgColor, style, utmSource, utmMedium, utmCampaign } = parsed.data

  try {
    // Enforce limits
    const subscription = await getCurrentUserSubscription()
    const isUserPro = session.user.role === 'admin' || isPro(subscription)
    
    if (!isUserPro) {
      const currentCount = await prisma.qrCode.count({
        where: { userId: session.user.id }
      })
      
      if (currentCount >= FREE_TIER_LIMITS.qr) {
        return { success: false, error: 'QR code limit reached. Please upgrade to Pro.' }
      }
    }

    let finalLinkId: string | null = null

    if (mode === 'existing') {
      if (!linkId) return { success: false, error: 'Link ID is required' }
      const link = await prisma.link.findUnique({ where: { id: linkId } })
      if (!link || link.userId !== session.user.id) {
        return { success: false, error: 'Link not found' }
      }
      finalLinkId = link.id
    } else if (mode === 'new') {
      if (!rawUrl) return { success: false, error: 'URL is required to shorten' }
      
      // Call existing link creation logic
      const res = await createLinkAction({ 
        url: rawUrl, 
        alias, 
        qrCode: false,
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
      })
      if (!res.success) {
        return { success: false, error: res.error }
      }
      finalLinkId = res.data.id
    }

    // Create the QR Code
    const qrCode = await prisma.qrCode.create({
      data: {
        userId: session.user.id,
        linkId: finalLinkId,
        color,
        bgColor,
        style,
      }
    })

    revalidatePath('/qr')
    return { success: true, data: qrCode }
  } catch (error) {
    console.error('[qr.create]', error)
    return { success: false, error: 'Failed to create QR code' }
  }
}

export async function deleteQrCode(id: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const qrCode = await prisma.qrCode.findUnique({
      where: { id }
    })

    if (!qrCode || qrCode.userId !== session.user.id) {
      return { success: false, error: 'QR code not found' }
    }

    await prisma.qrCode.delete({
      where: { id }
    })

    revalidatePath('/qr')
    return { success: true }
  } catch (error) {
    console.error('[qr.delete]', error)
    return { success: false, error: 'Failed to delete QR code' }
  }
}
