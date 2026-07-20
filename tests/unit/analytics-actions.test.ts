import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAccountAnalyticsAction,
  getAccountTimeSeriesAction,
  getAccountTopLinksAction,
  getAccountLocationsAction,
  getAccountReferrersAction,
  getAccountDevicesAction,
  getAccountStatusBreakdownAction,
  type DateRange,
} from '@/app/actions/links.analytics'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    link: { findUnique: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    click: { count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
    subscription: { findUnique: vi.fn() },
  },
  prismaQuery: vi.fn(async (fn) => await fn()),
}))

vi.mock('@/lib/plan', () => ({
  getCurrentUserSubscription: vi.fn(async () => null),
  isPro: vi.fn(() => false),
}))

const mockAuth = vi.mocked(auth)
import type { Mock } from 'vitest'

const mockPrisma = prisma as unknown as {
  link: { findUnique: Mock; findMany: Mock; groupBy: Mock }
  click: { count: Mock; findMany: Mock; groupBy: Mock }
}

const userId = 'test-user'

function mockSession() {
  // @ts-expect-error mock auth typing
  mockAuth.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role: 'admin' } })
}

beforeEach(() => {
  vi.resetAllMocks()
  mockSession()
})

// ─── getAccountAnalyticsAction ────────────────────────────────────────────────

describe('getAccountAnalyticsAction', () => {
  it('fails when not logged in', async () => {
    // @ts-expect-error mock auth typing
    mockAuth.mockResolvedValue(null)
    const result = await getAccountAnalyticsAction()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Not authenticated')
    }
  })

  it('returns zeros when user has no links', async () => {
    mockPrisma.link.groupBy.mockResolvedValue([])
    mockPrisma.link.findMany.mockResolvedValue([])

    const result = await getAccountAnalyticsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.totalLinks).toBe(0)
      expect(result.data.totalClicks).toBe(0)
      expect(result.data.activeLinks).toBe(0)
      expect(result.data.disabledLinks).toBe(0)
      expect(result.data.expiredLinks).toBe(0)
      expect(result.data.uniqueVisitors).toBe(0)
      expect(result.data.topCountry).toBeNull()
      expect(result.data.topDevice).toBeNull()
      expect(result.data.topReferrer).toBeNull()
    }
  })

  it('returns aggregated data when user has links', async () => {
    mockPrisma.link.groupBy.mockResolvedValue([
      { status: 'active', _count: { status: 5 } },
      { status: 'disabled', _count: { status: 2 } },
    ])
    mockPrisma.link.findMany.mockResolvedValue([
      { id: 'link-1' },
      { id: 'link-2' },
      { id: 'link-3' },
      { id: 'link-4' },
      { id: 'link-5' },
      { id: 'link-6' },
      { id: 'link-7' },
    ])
    mockPrisma.click.count.mockResolvedValue(42)
    mockPrisma.click.findMany.mockResolvedValue([
      { ip: '1.2.3.4' },
      { ip: '5.6.7.8' },
    ])
    mockPrisma.click.groupBy
      .mockResolvedValueOnce([{ country: 'US', _count: { country: 30 } }])
      .mockResolvedValueOnce([{ device: 'desktop', _count: { device: 25 } }])
      .mockResolvedValueOnce([{ referrer: 'https://twitter.com', _count: { referrer: 10 } }])

    const result = await getAccountAnalyticsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.totalLinks).toBe(7)
      expect(result.data.activeLinks).toBe(5)
      expect(result.data.disabledLinks).toBe(2)
      expect(result.data.expiredLinks).toBe(0)
      expect(result.data.totalClicks).toBe(42)
      expect(result.data.uniqueVisitors).toBe(2)
      expect(result.data.topCountry).toEqual({ name: 'United States', count: 30 })
      expect(result.data.topDevice).toEqual({ name: 'Desktop', count: 25 })
      expect(result.data.topReferrer).toEqual({ name: 'twitter.com', count: 10 })
    }
  })
})

// ─── getAccountTimeSeriesAction ───────────────────────────────────────────────

describe('getAccountTimeSeriesAction', () => {
  const range: DateRange = {
    from: new Date('2024-01-01T00:00:00Z'),
    to: new Date('2024-01-07T23:59:59Z'),
  }

  it('fails when not logged in', async () => {
    // @ts-expect-error mock auth typing
    mockAuth.mockResolvedValue(null)
    const result = await getAccountTimeSeriesAction(range)
    expect(result.success).toBe(false)
  })

  it('returns empty time series when user has no links', async () => {
    mockPrisma.link.findMany.mockResolvedValue([])

    const result = await getAccountTimeSeriesAction(range)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(7)
      expect(result.data.every((d) => d.count === 0)).toBe(true)
    }
  })

  it('fills time series with click data', async () => {
    mockPrisma.link.findMany.mockResolvedValue([{ id: 'link-1' }])
    mockPrisma.click.findMany.mockResolvedValue([
      { clickedAt: new Date('2024-01-02T10:00:00Z') },
      { clickedAt: new Date('2024-01-02T15:00:00Z') },
      { clickedAt: new Date('2024-01-04T08:00:00Z') },
    ])

    const result = await getAccountTimeSeriesAction(range)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(7)
      expect(result.data[1].count).toBe(2) // Jan 2
      expect(result.data[3].count).toBe(1) // Jan 4
      expect(result.data[0].count).toBe(0) // Jan 1
    }
  })
})

// ─── getAccountTopLinksAction ─────────────────────────────────────────────────

describe('getAccountTopLinksAction', () => {
  it('fails when not logged in', async () => {
    // @ts-expect-error mock auth typing
    mockAuth.mockResolvedValue(null)
    const result = await getAccountTopLinksAction()
    expect(result.success).toBe(false)
  })

  it('returns top links ordered by click count', async () => {
    // Mock returns data in insertion order; Prisma sorts by clickCount desc
    mockPrisma.link.findMany.mockResolvedValue([
      { id: 'a', slug: 'alpha', originalUrl: 'https://a.com', clickCount: 100, status: 'active' },
      { id: 'b', slug: 'beta', originalUrl: 'https://b.com', clickCount: 50, status: 'active' },
      { id: 'c', slug: 'gamma', originalUrl: 'https://c.com', clickCount: 200, status: 'active' },
    ])

    const result = await getAccountTopLinksAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
      expect(result.data[0].slug).toBe('alpha')
      expect(result.data[1].slug).toBe('beta')
      expect(result.data[2].slug).toBe('gamma')
    }
  })

  it('respects the limit parameter', async () => {
    mockPrisma.link.findMany.mockResolvedValue([
      { id: 'a', slug: 'alpha', originalUrl: 'https://a.com', clickCount: 100, status: 'active' },
    ])

    await getAccountTopLinksAction(5)
    expect(mockPrisma.link.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
  })
})

// ─── getAccountLocationsAction ────────────────────────────────────────────────

describe('getAccountLocationsAction', () => {
  it('fails when not logged in', async () => {
    // @ts-expect-error mock auth typing
    mockAuth.mockResolvedValue(null)
    const result = await getAccountLocationsAction()
    expect(result.success).toBe(false)
  })

  it('returns empty array when user has no links', async () => {
    mockPrisma.link.findMany.mockResolvedValue([])

    const result = await getAccountLocationsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([])
    }
  })

  it('returns ranked country data', async () => {
    mockPrisma.link.findMany.mockResolvedValue([{ id: 'link-1' }])
    mockPrisma.click.groupBy.mockResolvedValue([
      { country: 'US', _count: { country: 40 } },
      { country: 'GB', _count: { country: 20 } },
      { country: null, _count: { country: 5 } },
    ])

    const result = await getAccountLocationsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
      expect(result.data[0].name).toBe('United States')
      expect(result.data[0].count).toBe(40)
      expect(result.data[0].percentage).toBeCloseTo(66.67, 1)
      expect(result.data[1].name).toBe('United Kingdom')
      expect(result.data[1].count).toBe(20)
      expect(result.data[1].percentage).toBeCloseTo(33.33, 1)
    }
  })
})

// ─── getAccountReferrersAction ────────────────────────────────────────────────

describe('getAccountReferrersAction', () => {
  it('fails when not logged in', async () => {
    // @ts-expect-error mock auth typing
    mockAuth.mockResolvedValue(null)
    const result = await getAccountReferrersAction()
    expect(result.success).toBe(false)
  })

  it('formats referrers and handles direct traffic', async () => {
    mockPrisma.link.findMany.mockResolvedValue([{ id: 'link-1' }])
    mockPrisma.click.groupBy.mockResolvedValue([
      { referrer: null, _count: { referrer: 50 } },
      { referrer: 'https://twitter.com/post/123', _count: { referrer: 20 } },
    ])

    const result = await getAccountReferrersAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data[0].name).toBe('Direct')
      expect(result.data[0].count).toBe(50)
      expect(result.data[1].name).toBe('twitter.com')
      expect(result.data[1].count).toBe(20)
    }
  })
})

// ─── getAccountDevicesAction ──────────────────────────────────────────────────

describe('getAccountDevicesAction', () => {
  it('fails when not logged in', async () => {
    // @ts-expect-error mock auth typing
    mockAuth.mockResolvedValue(null)
    const result = await getAccountDevicesAction()
    expect(result.success).toBe(false)
  })

  it('returns separate device and browser rankings', async () => {
    mockPrisma.link.findMany.mockResolvedValue([{ id: 'link-1' }])
    mockPrisma.click.groupBy
      .mockResolvedValueOnce([
        { device: 'desktop', _count: { device: 60 } },
        { device: 'mobile', _count: { device: 40 } },
      ])
      .mockResolvedValueOnce([
        { browser: 'Chrome', _count: { browser: 70 } },
        { browser: 'Safari', _count: { browser: 30 } },
      ])

    const result = await getAccountDevicesAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.devices).toHaveLength(2)
      expect(result.data.devices[0].name).toBe('Desktop')
      expect(result.data.devices[0].count).toBe(60)

      expect(result.data.browsers).toHaveLength(2)
      expect(result.data.browsers[0].name).toBe('Chrome')
      expect(result.data.browsers[0].count).toBe(70)
    }
  })
})

// ─── getAccountStatusBreakdownAction ─────────────────────────────────────────

describe('getAccountStatusBreakdownAction', () => {
  it('fails when not logged in', async () => {
    // @ts-expect-error mock auth typing
    mockAuth.mockResolvedValue(null)
    const result = await getAccountStatusBreakdownAction()
    expect(result.success).toBe(false)
  })

  it('returns status breakdown with labels', async () => {
    mockPrisma.link.groupBy.mockResolvedValue([
      { status: 'active', _count: { status: 10 } },
      { status: 'disabled', _count: { status: 2 } },
      { status: 'expired', _count: { status: 1 } },
    ])

    const result = await getAccountStatusBreakdownAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
      expect(result.data.map((d) => d.name)).toEqual(['Active', 'Disabled', 'Expired'])
      expect(result.data[0].count).toBe(10)
    }
  })
})
