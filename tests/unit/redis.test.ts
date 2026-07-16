import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('getRedis', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN

  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.resetModules()
  })

  afterEach(() => {
    if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl
    if (originalToken) process.env.UPSTASH_REDIS_REST_TOKEN = originalToken
  })

  it('returns null when env vars are missing', async () => {
    const { getRedis } = await import('@/lib/redis')
    expect(getRedis()).toBeNull()
  })

  it('returns null when only one env var is set', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    const { getRedis } = await import('@/lib/redis')
    expect(getRedis()).toBeNull()
  })

  it('returns a client when both env vars are set', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    const { getRedis } = await import('@/lib/redis')
    const client = getRedis()
    expect(client).not.toBeNull()
    expect(typeof client?.get).toBe('function')
    expect(typeof client?.set).toBe('function')
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    const { getRedis } = await import('@/lib/redis')
    const a = getRedis()
    const b = getRedis()
    expect(a).toBe(b)
  })
})

describe('LINK_CACHE_KEY', () => {
  it('returns the expected key format', async () => {
    const { LINK_CACHE_KEY } = await import('@/lib/redis')
    expect(LINK_CACHE_KEY('abc')).toBe('cache:link:abc')
    expect(LINK_CACHE_KEY('my-link')).toBe('cache:link:my-link')
  })
})

describe('LINK_CACHE_TTL', () => {
  it('is 1 hour (3600 seconds)', async () => {
    const { LINK_CACHE_TTL } = await import('@/lib/redis')
    expect(LINK_CACHE_TTL).toBe(60 * 60)
  })
})
