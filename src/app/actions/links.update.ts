'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateLinkSchema } from '@/lib/validators'
import { invalidateCache } from './links.create'
import { getCurrentUserSubscription, isPro } from '@/lib/plan'

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

    // 5.5. Enforce Pro limits
    const subscription = await getCurrentUserSubscription()
    const isUserPro = session.user.role === 'admin' || isPro(subscription)

    if (!isUserPro) {
      if (alias !== undefined && alias !== existing.slug) {
        return { success: false as const, error: 'Custom aliases are a Pro feature.' }
      }
      
      const existingExpires = existing.expiresAt ? existing.expiresAt.getTime() : null
      const newExpires = expiresAt ? expiresAt.getTime() : null
      if (expiresAt !== undefined && newExpires !== existingExpires) {
        return { success: false as const, error: 'Link expiration is a Pro feature.' }
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
