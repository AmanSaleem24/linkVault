'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RESERVED_SLUGS, SLUG_REGEX, type LinkStatus } from '@/lib/validators'
import { FREE_TIER_LIMITS } from '@/lib/config'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortField = 'createdAt' | 'originalUrl' | 'slug' | 'status' | 'clickCount'
export type StatusFilter = 'all' | 'active' | 'disabled' | 'expired'

export interface LinksListParams {
  cursor?: string
  limit?: number
  search?: string
  status?: StatusFilter
  sortBy?: SortField
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedLinksResult {
  success: true
  data: {
    links: Array<{
      id: string
      originalUrl: string
      slug: string
      status: LinkStatus
      clickCount: number
      expiresAt: string | null
      createdAt: string
    }>
    nextCursor: string | null
    hasMore: boolean
    totalCount: number
  }
}

export type LinksResult = PaginatedLinksResult | { success: false; error: string }

// ─── Get Links (paginated) ────────────────────────────────────────────────────

export async function getLinksAction(params: LinksListParams = {}): Promise<LinksResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  const {
    cursor,
    limit = 20,
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    dateFrom,
    dateTo,
  } = params

  try {
    const where: any = { userId: session.user.id }

    if (search) {
      where.AND = where.AND || []
      where.AND.push({
        OR: [
          { originalUrl: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ]
      })
    }

    if (status && status !== 'all') {
      if (status === 'expired') {
        where.expiresAt = { lt: new Date() }
      } else if (status === 'active') {
        where.status = 'active'
        where.AND = where.AND || []
        where.AND.push({
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ]
        })
      } else {
        where.status = status
      }
    }

    if (dateFrom || dateTo) {
      const createdAt: Record<string, string> = {}
      if (dateFrom) createdAt.gte = new Date(dateFrom).toISOString()
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        createdAt.lte = end.toISOString()
      }
      where.createdAt = createdAt
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const fetchLimit = limit + 1

    // Run sequentially to avoid exhausting Neon's serverless connection pool
    const links = await prisma.link.findMany({
      where,
      orderBy,
      take: fetchLimit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    const totalCount = await prisma.link.count({ where })

    const hasMore = links.length > limit
    const pageLinks = hasMore ? links.slice(0, -1) : links
    const last = pageLinks[pageLinks.length - 1]
    const nextCursor = hasMore && last ? last.id : null

    return {
      success: true,
      data: {
        links: pageLinks.map(l => ({
          id: l.id,
          originalUrl: l.originalUrl,
          slug: l.slug,
          status: l.status as LinkStatus,
          clickCount: l.clickCount,
          expiresAt: l.expiresAt?.toISOString() ?? null,
          createdAt: l.createdAt.toISOString(),
        })),
        nextCursor,
        hasMore,
        totalCount,
      },
    }
  } catch (error) {
    console.error('Get links error:', error)
    return { success: false as const, error: 'Failed to fetch links' }
  }
}

// ─── Get User Links (non-paginated, for backward compat) ──────────────────────

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

// ─── Export Links as CSV ─────────────────────────────────────────────────────

export async function exportLinksAction(): Promise<{ success: true; csv: string } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  try {
    const links = await prisma.link.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        slug: true,
        originalUrl: true,
        status: true,
        clickCount: true,
        createdAt: true,
      },
    })

    const header = 'Slug,Original URL,Status,Clicks,Created At\n'
    const rows = links.map(l => {
      const escapedUrl = `"${l.originalUrl.replace(/"/g, '""')}"`
      const date = l.createdAt.toISOString()
      return `${l.slug},${escapedUrl},${l.status},${l.clickCount},${date}`
    })
    const csv = header + rows.join('\n')

    return { success: true, csv }
  } catch (error) {
    console.error('Export links error:', error)
    return { success: false as const, error: 'Failed to export links' }
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
