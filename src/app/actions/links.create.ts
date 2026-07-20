'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRedis, LINK_CACHE_KEY } from '@/lib/redis'
import { generateUniqueSlug } from '@/lib/slugs'
import { createLinkSchema, resolveExpiry, type ExpiryDuration } from '@/lib/validators'
import { getUserUsageStatsAction } from './links.read'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Best-effort Redis cache invalidation.
 * The redirect service caches slug→URL lookups in Redis.
 * When a link is mutated, we delete its cache entry so the next
 * redirect fetches fresh data from Postgres.
 *
 * Redis is optional — if not configured or unavailable, this silently no-ops.
 */
export async function invalidateCache(slug: string): Promise<void> {
  try {
    const r = getRedis()
    if (r) await r.del(LINK_CACHE_KEY(slug))
  } catch {
    // Redis not configured or unavailable — safe to skip
  }
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

  const { url, alias, expiresAt, qrCode, utmSource, utmMedium, utmCampaign } = parsed.data

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
    
    // Gatekeep Pro features
    if (alias) {
      return { success: false as const, error: 'Custom aliases are a Pro feature.' }
    }
    if (expiresAt !== undefined && expiresAt !== null) {
      return { success: false as const, error: 'Link expiration is a Pro feature.' }
    }
    if (utmSource || utmMedium || utmCampaign) {
      return { success: false as const, error: 'Custom UTM tags are a Pro feature.' }
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

    // 4.5 Apply UTM Defaults and Default Expiry if Pro
    let finalUrl = url
    let finalExpiresAt = expiresAt
    
    try {
      const urlObj = new URL(finalUrl)

      // A. Explicit UTMs take absolute precedence
      if (utmSource) urlObj.searchParams.set('utm_source', utmSource)
      if (utmMedium) urlObj.searchParams.set('utm_medium', utmMedium)
      if (utmCampaign) urlObj.searchParams.set('utm_campaign', utmCampaign)

      // B. Defaults from profile only apply if Pro and not explicitly set AND not in the URL natively
      if (isPro) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { defaultUtmSource: true, defaultUtmMedium: true, defaultUtmCampaign: true, defaultExpiresIn: true }
        })
        if (user) {
          if (user.defaultUtmSource && !urlObj.searchParams.has('utm_source')) {
            urlObj.searchParams.set('utm_source', user.defaultUtmSource)
          }
          if (user.defaultUtmMedium && !urlObj.searchParams.has('utm_medium')) {
            urlObj.searchParams.set('utm_medium', user.defaultUtmMedium)
          }
          if (user.defaultUtmCampaign && !urlObj.searchParams.has('utm_campaign')) {
            urlObj.searchParams.set('utm_campaign', user.defaultUtmCampaign)
          }
          if (finalExpiresAt === undefined && user.defaultExpiresIn) {
            finalExpiresAt = resolveExpiry(user.defaultExpiresIn as ExpiryDuration) ?? undefined
          }
        }
      }
      
      finalUrl = urlObj.toString()
    } catch (e) {
      // If URL parsing fails, silently fall back to original (Zod already validated it, so this shouldn't happen)
    }

    // 5. Create the link + audit log in a single transaction
    const link = await prisma.$transaction(async (tx) => {
      const created = await tx.link.create({
        data: {
          userId,
          originalUrl: finalUrl,
          slug,
          expiresAt: finalExpiresAt ?? null,
        },
      })

      if (qrCode) {
        await tx.qrCode.create({
          data: {
            userId,
            linkId: created.id,
            color: '#000000',
            bgColor: '#ffffff',
            style: 'squares',
          }
        })
      }

      await tx.auditLog.create({
        data: {
          userId,
          entityType: 'link',
          entityId: created.id,
          action: 'create',
          newValue: {
            originalUrl: finalUrl,
            slug,
            expiresAt: finalExpiresAt?.toISOString() ?? null,
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
