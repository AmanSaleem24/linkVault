import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserUsageStatsAction } from '@/app/actions/links'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isPro as mockIsPro, getCurrentUserSubscription as mockGetCurrentUserSubscription } from '@/lib/plan'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock the plan module (getCurrentUserSubscription / isPro)
vi.mock('@/lib/plan', () => ({
  getCurrentUserSubscription: vi.fn(),
  isPro: vi.fn(() => false),
}))

// Cast mocks to their vi.fn() types for full mock API access
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockPrisma = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> }
  auditLog: { findMany: ReturnType<typeof vi.fn> }
  subscription: { findUnique: ReturnType<typeof vi.fn> }
}

describe('getUserUsageStatsAction', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('fails if user is not logged in', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('You must be logged in')
    }
  })

  it('identifies free tier users and returns usage counts', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'user' })

    mockPrisma.auditLog.findMany.mockResolvedValue([
      { newValue: { hasQrCode: false } },
      { newValue: { hasQrCode: false } },
      { newValue: { hasQrCode: true } },
    ])

    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPro).toBe(false)
      expect(result.data.linkCount).toBe(3)
      expect(result.data.qrCount).toBe(1)
      expect(result.data.limits).toEqual({ links: 50, qr: 10 })
    }
  })

  it('identifies pro tier users (active subscription)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'pro-1', role: 'user' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'pro-1', role: 'user' })
    vi.mocked(mockGetCurrentUserSubscription).mockResolvedValue({ status: 'ACTIVE' } as never)
    vi.mocked(mockIsPro).mockReturnValue(true)

    mockPrisma.auditLog.findMany.mockResolvedValue([])

    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPro).toBe(true)
    }
  })

  it('identifies admin tier users as pro', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: 'admin' })

    mockPrisma.auditLog.findMany.mockResolvedValue([])

    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPro).toBe(true)
    }
  })
})
