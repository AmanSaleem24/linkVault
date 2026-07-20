import { getRedis } from './redis'

const RATE_LIMIT_PREFIX = 'ratelimit:'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const r = getRedis()
  if (!r) return { allowed: true, remaining: limit, resetAt: Date.now() + windowSeconds * 1000 }

  const fullKey = `${RATE_LIMIT_PREFIX}${key}`

  const current = await r.incr(fullKey)

  if (current === 1) {
    await r.expire(fullKey, windowSeconds)
  }

  const ttl = await r.ttl(fullKey)
  const resetAt = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000

  if (current > limit) {
    return { allowed: false, remaining: 0, resetAt }
  }

  return {
    allowed: true,
    remaining: limit - current,
    resetAt,
  }
}
