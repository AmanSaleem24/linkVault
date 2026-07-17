'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRedis, LINK_CACHE_KEY } from '@/lib/redis'
import { invalidateCache } from './links.create'

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
