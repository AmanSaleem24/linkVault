import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// ─── Key helpers ──────────────────────────────────────────────────────────────

export const LINK_CACHE_KEY = (slug: string) => `cache:link:${slug}`
export const LINK_CACHE_TTL = 60 * 60 // 1 hour in seconds

export type CachedLink = {
  originalUrl: string
  status: 'active' | 'disabled' | 'expired'
  expiresAt: string | null
}
