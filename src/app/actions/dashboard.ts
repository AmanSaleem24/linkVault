'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FREE_TIER_LIMITS } from '@/lib/config'
import { getCurrentUserSubscription } from '@/lib/plan'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalLinks: number
  /** Links with status=active and not yet expired */
  activeLinks: number
  /** null for free users — never sent from server */
  totalClicks: number | null
  qrCodesCreated: number
  /** null for pro users (unlimited) */
  linksRemainingThisMonth: number | null
  /** null for pro users (unlimited) */
  qrCodesRemainingThisMonth: number | null
}

export interface RecentLinkRow {
  id: string
  slug: string
  originalUrl: string
  /** null for free users — never sent from server */
  clickCount: number | null
  createdAt: string
}

export interface DashboardData {
  firstName: string
  stats: DashboardStats
  recentLinks: RecentLinkRow[]
  isPro: boolean
}

export type DashboardResult =
  | { success: true; data: DashboardData }
  | { success: false; error: string }

// ─── Action ───────────────────────────────────────────────────────────────────

export async function getDashboardDataAction(): Promise<DashboardResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'You must be logged in' }
  }

  const userId = session.user.id

  // Always fetch the freshest role/subscription from DB (upgrade doesn't require re-login)
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true },
  })

  if (!dbUser) {
    return { success: false, error: 'User not found' }
  }

  const subscription = await getCurrentUserSubscription()
  const isPro =
    dbUser.role === 'admin' || subscription?.status === 'ACTIVE'

  // ── Parse first name ───────────────────────────────────────────────────────
  const firstName = dbUser.name?.split(' ')[0] ?? session.user.email?.split('@')[0] ?? 'there'

  // ── Start-of-month boundary ────────────────────────────────────────────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  try {
    // ── 1. Total links and active links ─────────────────────────────────────
    const totalLinks = await prisma.link.count({ where: { userId } })

    // Active = status is 'active' AND (no expiry OR expiry is in the future)
    const now = new Date()
    const activeLinks = await prisma.link.count({
      where: {
        userId,
        status: 'active',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
    })

    // ── 2. QR codes created this month (via audit log) ─────────────────────
    //    We track hasQrCode in the audit log newValue JSON, same as usage-stats
    const thisMonthLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        entityType: 'link',
        action: 'create',
        createdAt: { gte: startOfMonth },
      },
      select: { newValue: true },
    })

    const linksThisMonth = thisMonthLogs.length
    const qrCodesCreated = thisMonthLogs.filter((log) => {
      if (!log.newValue || typeof log.newValue !== 'object') return false
      return (log.newValue as Record<string, unknown>).hasQrCode === true
    }).length

    // ── 3. Click analytics — GATED: free users get null ───────────────────
    let totalClicks: number | null = null

    if (isPro) {
      const agg = await prisma.link.aggregate({
        where: { userId },
        _sum: { clickCount: true },
      })
      totalClicks = agg._sum.clickCount ?? 0
    }
    // Free users: totalClicks stays null — never sent to client

    // ── 4. Remaining quotas (free users only) ─────────────────────────────
    const linksRemainingThisMonth = isPro
      ? null
      : Math.max(0, FREE_TIER_LIMITS.links - linksThisMonth)

    const qrCodesRemainingThisMonth = isPro
      ? null
      : Math.max(0, FREE_TIER_LIMITS.qr - qrCodesCreated)

    // ── 5. Recent links — up to 10, newest first ───────────────────────────
    const rawLinks = await prisma.link.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        slug: true,
        originalUrl: true,
        clickCount: true,
        createdAt: true,
      },
    })

    // Gate click counts server-side for free users
    const recentLinks: RecentLinkRow[] = rawLinks.map((l) => ({
      id: l.id,
      slug: l.slug,
      originalUrl: l.originalUrl,
      clickCount: isPro ? l.clickCount : null,
      createdAt: l.createdAt.toISOString(),
    }))

    return {
      success: true,
      data: {
        firstName,
        stats: {
          totalLinks,
          activeLinks,
          totalClicks,
          qrCodesCreated,
          linksRemainingThisMonth,
          qrCodesRemainingThisMonth,
        },
        recentLinks,
        isPro,
      },
    }
  } catch (error) {
    console.error('getDashboardDataAction error:', error)
    return { success: false, error: 'Failed to load dashboard data' }
  }
}
