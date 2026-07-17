'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RESERVED_SLUGS, SLUG_REGEX } from '@/lib/validators'
import { FREE_TIER_LIMITS } from '@/lib/config'

// ─── Get User Links ───────────────────────────────────────────────────────────

export async function getUserLinksAction() {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }
  const userId = session.user.id

  try {
    // 2. Fetch all links owned by this user, newest first
    //    No pagination yet — that comes in Day 6.
    const links = await prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true as const, data: links }
  } catch (error) {
    console.error('Get user links error:', error)
    return { success: false as const, error: 'Failed to fetch links' }
  }
}

// ─── Get User Usage Stats ─────────────────────────────────────────────────────

export async function getUserUsageStatsAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }
  const userId = session.user.id

  // Always fetch the freshest role from the database so users don't have to re-login after upgrading.
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  const isPro = dbUser?.role === 'admin' || dbUser?.role === 'pro'

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  try {
    // If user is Pro, bypass the expensive audit log queries since they have no limits
    let linkCount = 0
    let qrCount = 0

    if (!isPro) {
      const logs = await prisma.auditLog.findMany({
        where: {
          userId,
          entityType: 'link',
          action: 'create',
          createdAt: { gte: startOfMonth },
        },
        select: { newValue: true },
      })

      linkCount = logs.length
      qrCount = logs.filter(log => {
        if (!log.newValue || typeof log.newValue !== 'object') return false
        return (log.newValue as Record<string, any>).hasQrCode === true
      }).length
    }

    return {
      success: true as const,
      data: {
        linkCount,
        qrCount,
        isPro,
        limits: FREE_TIER_LIMITS,
      },
    }
  } catch (error) {
    console.error('Get user usage stats error:', error)
    return { success: false as const, error: 'Failed to fetch usage stats' }
  }
}

// ─── Alias availability check ──────────────────────────────────────────────

export async function checkAliasAvailabilityAction(slug: string): Promise<{ available: boolean; reason?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { available: false, reason: 'You must be logged in' }
  }

  const trimmed = slug.trim().toLowerCase()

  if (!trimmed) {
    return { available: false, reason: 'Alias is empty' }
  }

  if (!SLUG_REGEX.test(trimmed)) {
    return { available: false, reason: 'Only lowercase letters, numbers, and hyphens allowed' }
  }

  if (RESERVED_SLUGS.includes(trimmed as any)) {
    return { available: false, reason: 'This alias is reserved' }
  }

  const existing = await prisma.link.findUnique({
    where: { slug: trimmed },
    select: { id: true },
  })

  if (existing) {
    return { available: false, reason: 'This alias is already taken' }
  }

  return { available: true }
}
