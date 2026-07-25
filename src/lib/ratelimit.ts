import { Ratelimit } from '@upstash/ratelimit'
import { getRedis } from '@/lib/redis'
import { headers } from 'next/headers'

// Track if we have already logged a Redis failure to avoid log spam across requests.
// Note: In serverless/Edge environments, this resets per cold-start.
let hasLoggedRedisError = false

// Helper to safely execute a rate limit check, gracefully falling open (allowing the request)
// if Redis is unconfigured or unreachable.
async function safeLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    return await limiter.limit(identifier)
  } catch (error) {
    if (!hasLoggedRedisError) {
      console.error(
        '[RateLimit] Failed to connect to Redis. Rate limiting is currently DISABLED.',
        error
      )
      hasLoggedRedisError = true
    }
    // Fail-open: allow the request, but return extreme/undefined values
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }
}

// ─── IP Extraction ────────────────────────────────────────────────────────────

export async function getIp(): Promise<string | null> {
  const headersList = await headers()
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    null
  )
}

// ─── Limiters ─────────────────────────────────────────────────────────────────

// Create dummy limiter if Redis is null (so the app doesn't crash on boot)
const dummyLimiter = {
  limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
} as unknown as Ratelimit

const redis = getRedis()

// 1. Link Creation Limiter: 20 per minute per User (NAT-safe)
const _createLinkLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/create-link',
    })
  : dummyLimiter

export const createLinkLimiter = {
  limit: (identifier: string) => safeLimit(_createLinkLimiter, identifier),
}

// 2. Redirect Limiter: 100 per 10 seconds per IP (with Ephemeral Cache)
// Note: Ephemeral cache reduces Redis latency on the hot redirect path.
const _redirectLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '10 s'),
      analytics: false,
      ephemeralCache: new Map(),
      prefix: '@upstash/ratelimit/redirect',
    })
  : dummyLimiter

export const redirectLimiter = {
  limit: (identifier: string) => safeLimit(_redirectLimiter, identifier),
}

// 3. Auth IP Limiter: 5 per minute per IP (Login, Signup, Forgot Password)
const _authIpLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth-ip',
    })
  : dummyLimiter

export const authIpLimiter = {
  limit: (identifier: string) => safeLimit(_authIpLimiter, identifier),
}

// 4. Auth Email Limiter: 5 per minute per Email (Login credential stuffing mitigation)
const _authEmailLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth-email',
    })
  : dummyLimiter

export const authEmailLimiter = {
  limit: (identifier: string) => safeLimit(_authEmailLimiter, identifier),
}
