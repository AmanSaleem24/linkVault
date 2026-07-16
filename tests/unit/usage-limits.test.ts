import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserUsageStatsAction } from '@/app/actions/links'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      count: vi.fn(),
    },
  },
}))

describe('getUserUsageStatsAction', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('fails if user is not logged in', async () => {
    // @ts-ignore
    vi.mocked(auth).mockResolvedValue(null)
    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('You must be logged in')
    }
  })

  it('identifies free tier users and returns usage counts', async () => {
    // @ts-ignore
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1', role: 'user' } })
    
    // First call for links, second call for qr codes
    // @ts-ignore
    vi.mocked(prisma.auditLog.count)
      .mockResolvedValueOnce(25) // linkCount
      .mockResolvedValueOnce(5)  // qrCount

    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPro).toBe(false)
      expect(result.data.linkCount).toBe(25)
      expect(result.data.qrCount).toBe(5)
      expect(result.data.limits).toEqual({ links: 50, qr: 10 })
    }
  })

  it('identifies pro tier users', async () => {
    // @ts-ignore
    vi.mocked(auth).mockResolvedValue({ user: { id: 'pro-1', role: 'pro' } })
    
    // @ts-ignore
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPro).toBe(true)
    }
  })

  it('identifies admin tier users as pro', async () => {
    // @ts-ignore
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    
    // @ts-ignore
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0)

    const result = await getUserUsageStatsAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPro).toBe(true)
    }
  })
})
