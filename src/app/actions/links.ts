'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRedis, LINK_CACHE_KEY } from '@/lib/redis'
import { generateUniqueSlug } from '@/lib/slugs'
import { createLinkSchema, updateLinkSchema } from '@/lib/validators'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Best-effort Redis cache invalidation.
 * The redirect service (Day 5) caches slug→URL lookups in Redis.
 * When a link is mutated, we delete its cache entry so the next
 * redirect fetches fresh data from Postgres.
 *
 * Redis is optional — if not configured or unavailable, this silently no-ops.
 */
async function invalidateCache(slug: string): Promise<void> {
  try {
    const r = getRedis()
    if (r) await r.del(LINK_CACHE_KEY(slug))
  } catch {
    // Redis not configured or unavailable — safe to skip
  }
}

const FREE_TIER_LIMITS = {
  links: 50,
  qr: 10,
}

// ─── Create Link ──────────────────────────────────────────────────────────────

export async function createLinkAction(input: unknown) {
  // 1. Validate input
  const parsed = createLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  // 2. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }
  const userId = session.user.id

  const { url, alias, expiresAt, qrCode } = parsed.data

  // 3. Enforce limits for free users
  const usageStats = await getUserUsageStatsAction()
  if (!usageStats.success) {
    return { success: false as const, error: 'Failed to check usage limits' }
  }
  const { linkCount, qrCount, isPro, limits } = usageStats.data
  
  if (!isPro) {
    if (linkCount >= limits.links) {
      return { success: false as const, error: `You have reached your monthly limit of ${limits.links} links. Please upgrade to Pro.` }
    }
    if (qrCode && qrCount >= limits.qr) {
      return { success: false as const, error: `You have reached your monthly limit of ${limits.qr} QR codes. Please upgrade to Pro.` }
    }
  }

  try {
    // 4. Generate or validate the slug
    let slug: string

    if (alias) {
      // Custom alias — check uniqueness in the database
      const existing = await prisma.link.findUnique({ where: { slug: alias } })
      if (existing) {
        return { success: false as const, error: 'This alias is already taken' }
      }
      slug = alias
    } else {
      // Auto-generate a unique slug (retries on collision)
      slug = await generateUniqueSlug(async (candidate) => {
        const existing = await prisma.link.findUnique({ where: { slug: candidate } })
        return Boolean(existing)
      })
    }

    // 5. Create the link + audit log in a single transaction
    const link = await prisma.$transaction(async (tx) => {
      const created = await tx.link.create({
        data: {
          userId,
          originalUrl: url,
          slug,
          expiresAt: expiresAt ?? null,
        },
      })

      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'link',
          entityId: created.id,
          action: 'create',
          newValue: {
            originalUrl: url,
            slug,
            expiresAt: expiresAt?.toISOString() ?? null,
            hasQrCode: qrCode ?? false,
          },
        },
      })

      return created
    })

    // 5. Revalidate the dashboard so the new link appears immediately
    revalidatePath('/home')
    revalidatePath('/link')

    return { success: true as const, data: link }
  } catch (error) {
    console.error('Create link error:', error)
    return { success: false as const, error: 'Failed to create link' }
  }
}

// ─── Update Link ──────────────────────────────────────────────────────────────

export async function updateLinkAction(input: unknown) {
  // 1. Validate input
  const parsed = updateLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  // 2. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }
  const userId = session.user.id

  const { id, url, alias, expiresAt } = parsed.data

  try {
    // 3. Fetch the existing link (for ownership check + audit snapshot)
    const existing = await prisma.link.findUnique({ where: { id } })
    if (!existing) {
      return { success: false as const, error: 'Link not found' }
    }

    // 4. Enforce row-level ownership
    if (existing.userId !== userId) {
      return { success: false as const, error: 'You do not own this link' }
    }

    // 5. If alias is changing, check uniqueness
    if (alias && alias !== existing.slug) {
      const taken = await prisma.link.findUnique({ where: { slug: alias } })
      if (taken) {
        return { success: false as const, error: 'This alias is already taken' }
      }
    }

    // 6. Build the update data (only include fields that were provided)
    const updateData: Record<string, unknown> = {}
    if (url !== undefined) updateData.originalUrl = url
    if (alias !== undefined) updateData.slug = alias
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt

    // 7. Update link + audit log in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.link.update({
        where: { id },
        data: updateData,
      })

      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'link',
          entityId: id,
          action: 'update',
          previousValue: {
            originalUrl: existing.originalUrl,
            slug: existing.slug,
            expiresAt: existing.expiresAt?.toISOString() ?? null,
          },
          newValue: {
            originalUrl: result.originalUrl,
            slug: result.slug,
            expiresAt: result.expiresAt?.toISOString() ?? null,
          },
        },
      })

      return result
    })

    // 8. Invalidate Redis cache for the old slug (and new slug if it changed)
    await invalidateCache(existing.slug)
    if (alias && alias !== existing.slug) {
      await invalidateCache(alias)
    }

    // 9. Revalidate dashboard
    revalidatePath('/home')
    revalidatePath('/link')

    return { success: true as const, data: updated }
  } catch (error) {
    console.error('Update link error:', error)
    return { success: false as const, error: 'Failed to update link' }
  }
}

// ─── Delete Link ──────────────────────────────────────────────────────────────

export async function deleteLinkAction(id: string) {
  // 1. Validate input
  if (!id || typeof id !== 'string') {
    return { success: false as const, error: 'Link ID is required' }
  }

  // 2. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }
  const userId = session.user.id

  try {
    // 3. Fetch the link (for ownership check + audit snapshot)
    const existing = await prisma.link.findUnique({ where: { id } })
    if (!existing) {
      return { success: false as const, error: 'Link not found' }
    }

    // 4. Enforce row-level ownership
    if (existing.userId !== userId) {
      return { success: false as const, error: 'You do not own this link' }
    }

    // 5. Audit log first, then delete (in a transaction)
    //    Audit log references userId, not linkId, so it survives the cascade delete.
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'link',
          entityId: id,
          action: 'delete',
          previousValue: {
            originalUrl: existing.originalUrl,
            slug: existing.slug,
            status: existing.status,
            clickCount: existing.clickCount,
            expiresAt: existing.expiresAt?.toISOString() ?? null,
            createdAt: existing.createdAt.toISOString(),
          },
        },
      })

      // Hard delete — cascades to Click rows
      await tx.link.delete({ where: { id } })
    })

    // 6. Invalidate Redis cache
    await invalidateCache(existing.slug)

    // 7. Revalidate dashboard
    revalidatePath('/home')
    revalidatePath('/link')

    return { success: true as const }
  } catch (error) {
    console.error('Delete link error:', error)
    return { success: false as const, error: 'Failed to delete link' }
  }
}

// ─── Toggle Link Status ───────────────────────────────────────────────────────

export async function toggleLinkStatusAction(
  id: string,
  newStatus: 'active' | 'disabled'
) {
  // 1. Validate inputs
  if (!id || typeof id !== 'string') {
    return { success: false as const, error: 'Link ID is required' }
  }
  if (newStatus !== 'active' && newStatus !== 'disabled') {
    return { success: false as const, error: 'Status must be "active" or "disabled"' }
  }

  // 2. Authenticate
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }
  const userId = session.user.id

  try {
    // 3. Fetch the link
    const existing = await prisma.link.findUnique({ where: { id } })
    if (!existing) {
      return { success: false as const, error: 'Link not found' }
    }

    // 4. Enforce row-level ownership
    if (existing.userId !== userId) {
      return { success: false as const, error: 'You do not own this link' }
    }

    // 5. Skip if already in the desired status
    if (existing.status === newStatus) {
      return { success: true as const, data: existing }
    }

    // 6. Update status + audit log in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.link.update({
        where: { id },
        data: { status: newStatus },
      })

      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'link',
          entityId: id,
          action: newStatus === 'active' ? 'enable' : 'disable',
          previousValue: { status: existing.status },
          newValue: { status: newStatus },
        },
      })

      return result
    })

    // 7. Invalidate Redis cache (redirect service uses cached status)
    await invalidateCache(existing.slug)

    // 8. Revalidate dashboard
    revalidatePath('/home')
    revalidatePath('/link')

    return { success: true as const, data: updated }
  } catch (error) {
    console.error('Toggle link status error:', error)
    return { success: false as const, error: 'Failed to update link status' }
  }
}

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
