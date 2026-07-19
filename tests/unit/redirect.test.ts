import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  link: { findUnique: vi.fn(), update: vi.fn() },
  click: { create: vi.fn() },
}))

const mockRedisGet = vi.hoisted(() => vi.fn())

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    after: (callback: () => void) => callback(),
  }
})

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

vi.mock('@/lib/redis', () => ({
  getRedis: mockRedisGet,
  LINK_CACHE_KEY: (slug: string) => `cache:link:${slug}`,
  LINK_CACHE_TTL: 3600,
}))

// ─── Imports ────────────────────────────────────────────────────────────────

import { GET } from '@/app/[slug]/route'
import { NextRequest, NextResponse } from 'next/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

function mockRedisReturn(value: unknown) {
  mockRedisGet.mockReturnValue({
    get: vi.fn().mockResolvedValue(value),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  })
}

function mockRedisNull() {
  mockRedisGet.mockReturnValue(null)
}

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return {
    url: 'http://localhost:3000/test-link',
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest
}

const params = Promise.resolve({ slug: 'test-link' })

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('GET redirect handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Cache hit ─────────────────────────────────────────────────────────────

  it('redirects to original URL on cache hit', async () => {
    mockRedisReturn({
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })
    // after() callback fires synchronously and calls findUnique
    mockPrisma.link.findUnique.mockResolvedValue({ id: 'link-1' })

    const response = await GET(makeRequest(), { params })

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://example.com/')
  })

  it('falls through to DB when cached entry is expired', async () => {
    mockRedisReturn({
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    })

    mockPrisma.link.findUnique.mockResolvedValue(null)

    const response = await GET(makeRequest(), { params })

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(404)
    expect(mockPrisma.link.findUnique).toHaveBeenCalled()
  })

  // ── Cache miss → DB hit ───────────────────────────────────────────────────

  it('falls back to DB on cache miss and redirects', async () => {
    mockRedisNull()

    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    const response = await GET(makeRequest(), { params })

    expect(mockPrisma.link.findUnique).toHaveBeenCalledWith({
      where: { slug: 'test-link' },
      select: expect.any(Object),
    })
    expect(mockRedisGet).toHaveBeenCalled()
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://example.com/')
  })

  it('caches the result on DB hit', async () => {
    const redisInstance = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    }
    mockRedisGet.mockReturnValue(redisInstance)

    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    await GET(makeRequest(), { params })

    expect(redisInstance.set).toHaveBeenCalledWith(
      'cache:link:test-link',
      expect.objectContaining({
        originalUrl: 'https://example.com/',
        status: 'active',
        expiresAt: null,
      }),
      { ex: 3600 },
    )
  })

  // ── Click analytics ───────────────────────────────────────────────────────

  it('creates a Click record and increments clickCount on redirect', async () => {
    mockRedisNull()

    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    await GET(
      makeRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        referer: 'https://twitter.com',
        'x-country': 'US',
      }),
      { params },
    )

    expect(mockPrisma.click.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: 'link-1',
        browser: 'Chrome',
        os: 'Windows',
        device: 'desktop',
        country: 'US',
        referrer: 'https://twitter.com',
        ip: undefined,
      }),
    })
    expect(mockPrisma.link.update).toHaveBeenCalledWith({
      where: { id: 'link-1' },
      data: { clickCount: { increment: 1 } },
    })
  })

  // ── Not found cases ───────────────────────────────────────────────────────

  it('returns 404 for non-existent slug', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue(null)

    const response = await GET(makeRequest(), { params })

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(404)
  })

  it('redirects to /disabled for disabled links', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'disabled',
      expiresAt: null,
    })

    const response = await GET(makeRequest(), { params })

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/disabled/test-link')
  })

  it('redirects to /expired for expired links', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: new Date(Date.now() - 3600_000),
    })

    const response = await GET(makeRequest(), { params })

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/expired/test-link')
  })

  // ── Reserved slugs ────────────────────────────────────────────────────────

  it('returns 404 for reserved slugs', async () => {
    const response = await GET(makeRequest(), { params: Promise.resolve({ slug: 'admin' }) })
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(404)
  })

  it('returns 404 for api slug', async () => {
    const response = await GET(makeRequest(), { params: Promise.resolve({ slug: 'api' }) })
    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(404)
  })

  // ── Graceful degradation when Redis is down ───────────────────────────────

  it('falls through to DB when Redis throws', async () => {
    const redisInstance = {
      get: vi.fn().mockRejectedValue(new Error('Redis down')),
      set: vi.fn(),
      del: vi.fn(),
    }
    mockRedisGet.mockReturnValue(redisInstance)

    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    const response = await GET(makeRequest(), { params })

    expect(response.status).toBe(302)
    expect(mockPrisma.link.findUnique).toHaveBeenCalled()
  })

  it('returns 404 when database is unreachable', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockRejectedValue(new Error('ETIMEDOUT'))

    const response = await GET(makeRequest(), { params })

    expect(response).toBeInstanceOf(NextResponse)
    expect(response.status).toBe(404)
  })
})

describe('User-Agent parsing (via redirect handler)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('defaults to unknown when user-agent is missing', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    await GET(makeRequest(), { params })

    expect(mockPrisma.click.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: 'link-1',
        browser: 'unknown',
        os: 'unknown',
        device: 'unknown',
      }),
    })
  })

  it('parses Windows + Chrome', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    await GET(
      makeRequest({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }),
      { params },
    )

    expect(mockPrisma.click.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: 'link-1',
        browser: 'Chrome',
        os: 'Windows',
        device: 'desktop',
      }),
    })
  })

  it('parses macOS + Safari', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    await GET(
      makeRequest({
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      }),
      { params },
    )

    expect(mockPrisma.click.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: 'link-1',
        browser: 'Safari',
        os: 'macOS',
        device: 'desktop',
      }),
    })
  })

  it('parses iPhone user agent as mobile', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    await GET(
      makeRequest({
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      }),
      { params },
    )

    expect(mockPrisma.click.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: 'link-1',
        browser: 'Safari',
        os: 'iOS',
        device: 'mobile',
      }),
    })
  })

  it('parses Android as mobile', async () => {
    mockRedisNull()
    mockPrisma.link.findUnique.mockResolvedValue({
      id: 'link-1',
      originalUrl: 'https://example.com/',
      status: 'active',
      expiresAt: null,
    })

    await GET(
      makeRequest({
        'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      }),
      { params },
    )

    expect(mockPrisma.click.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        linkId: 'link-1',
        browser: 'Chrome',
        os: 'Android',
        device: 'mobile',
      }),
    })
  })
})
