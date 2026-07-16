import { Redis } from '@upstash/redis'

// ─── Lazy Redis Client ────────────────────────────────────────────────────────

let _redis: Redis | null = null

/**
 * Returns the Redis client, creating it on first call.
 * Returns null if Upstash env vars are not configured.
 *
 * Redis is an optional dependency — the redirect service falls
 * back to Postgres when Redis is unavailable.
 */
export function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

export const LINK_CACHE_KEY = (slug: string) => `cache:link:${slug}`
export const LINK_CACHE_TTL = 60 * 60 // 1 hour in seconds

export type CachedLink = {
  originalUrl: string
  status: 'active' | 'disabled' | 'expired'
  expiresAt: string | null
}
