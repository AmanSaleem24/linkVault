import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getUserRoleAction,
} from '@/app/actions/user.getRole'
import {
  exportLinksAction,
  getAuditLogAction,
  type AuditLogEntry,
} from '@/app/actions/links.read'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    link: { findMany: vi.fn() },
    auditLog: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// @ts-ignore
const mockAuth = vi.mocked(auth)
// @ts-ignore
const mockPrisma = vi.mocked(prisma)

const userId = 'test-user'

function mockSession(role: string = 'user') {
  // @ts-ignore
  mockAuth.mockResolvedValue({ user: { id: userId, email: 'test@test.com', role } })
}

beforeEach(() => {
  vi.resetAllMocks()
})

// ─── getUserRoleAction ────────────────────────────────────────────────────────

describe('getUserRoleAction', () => {
  it('returns false when not logged in', async () => {
    // @ts-ignore
    mockAuth.mockResolvedValue(null)
    const result = await getUserRoleAction()
    expect(result.isPro).toBe(false)
  })

  it('returns false for regular user role', async () => {
    mockSession('user')
    const result = await getUserRoleAction()
    expect(result.isPro).toBe(false)
  })

  it('returns true for pro role', async () => {
    mockSession('pro')
    const result = await getUserRoleAction()
    expect(result.isPro).toBe(true)
  })

  it('returns true for admin role', async () => {
    mockSession('admin')
    const result = await getUserRoleAction()
    expect(result.isPro).toBe(true)
  })
})

// ─── exportLinksAction ────────────────────────────────────────────────────────

describe('exportLinksAction', () => {
  it('fails when not logged in', async () => {
    // @ts-ignore
    mockAuth.mockResolvedValue(null)
    const result = await exportLinksAction()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('You must be logged in')
    }
  })

  it('returns CSV with correct headers', async () => {
    mockSession('user')
    mockPrisma.link.findMany.mockResolvedValue([])

    const result = await exportLinksAction()
    expect(result.success).toBe(true)
    if (result.success) {
      const lines = result.csv.split('\n')
      expect(lines[0]).toBe('Slug,Original URL,Status,Clicks,Created At')
    }
  })

  it('escapes URLs with quotes in CSV', async () => {
    mockSession('user')
    mockPrisma.link.findMany.mockResolvedValue([
      {
        slug: 'test',
        originalUrl: 'https://example.com/"weird"',
        status: 'active',
        clickCount: 5,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ])

    const result = await exportLinksAction()
    expect(result.success).toBe(true)
    if (result.success) {
      // CSV wraps cell in quotes, doubles internal quotes: "url"" => """url"""
      expect(result.csv).toContain('"https://example.com/""weird"""')
    }
  })

  it('includes all link fields in CSV rows', async () => {
    mockSession('user')
    mockPrisma.link.findMany.mockResolvedValue([
      {
        slug: 'abc123',
        originalUrl: 'https://example.com',
        status: 'active',
        clickCount: 42,
        createdAt: new Date('2026-07-15T10:00:00.000Z'),
      },
    ])

    const result = await exportLinksAction()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.csv).toContain('abc123')
      expect(result.csv).toContain('https://example.com')
      expect(result.csv).toContain('active')
      expect(result.csv).toContain('42')
    }
  })
})

// ─── getAuditLogAction ────────────────────────────────────────────────────────

describe('getAuditLogAction', () => {
  const mockLogs = [
    {
      id: 'log-1',
      entityId: 'link-1',
      action: 'create',
      entityType: 'link',
      previousValue: null,
      newValue: { slug: 'abc', originalUrl: 'https://a.com' },
      createdAt: new Date('2026-07-19T10:00:00Z'),
    },
    {
      id: 'log-2',
      entityId: 'link-1',
      action: 'update',
      entityType: 'link',
      previousValue: { status: 'active' },
      newValue: { status: 'disabled' },
      createdAt: new Date('2026-07-18T08:00:00Z'),
    },
  ]

  const mockLinks = [
    { id: 'link-1', slug: 'abc', originalUrl: 'https://a.com' },
  ]

  it('fails when not logged in', async () => {
    // @ts-ignore
    mockAuth.mockResolvedValue(null)
    const result = await getAuditLogAction({ isPro: true })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('You must be logged in')
    }
  })

  it('returns empty data for free users', async () => {
    mockSession('user')
    const result = await getAuditLogAction({ isPro: false })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.logs).toEqual([])
      expect(result.data.totalCount).toBe(0)
      expect(result.data.nextCursor).toBeNull()
    }
  })

  it('returns formatted logs for Pro users', async () => {
    mockSession('pro')
    mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs)
    mockPrisma.link.findMany.mockResolvedValue(mockLinks)
    mockPrisma.auditLog.count.mockResolvedValue(2)

    const result = await getAuditLogAction({ isPro: true })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.logs).toHaveLength(2)
      expect(result.data.logs[0]).toEqual({
        id: 'log-1',
        action: 'create',
        entityType: 'link',
        entityId: 'link-1',
        previousValue: null,
        newValue: { slug: 'abc', originalUrl: 'https://a.com' },
        createdAt: '2026-07-19T10:00:00.000Z',
        linkSlug: 'abc',
        linkUrl: 'https://a.com',
      })
      expect(result.data.totalCount).toBe(2)
    }
  })

  it('resolves link metadata (slug and URL) for each log entry', async () => {
    mockSession('pro')
    mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs)
    mockPrisma.link.findMany.mockResolvedValue(mockLinks)
    mockPrisma.auditLog.count.mockResolvedValue(2)

    const result = await getAuditLogAction({ isPro: true })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.logs[0].linkSlug).toBe('abc')
      expect(result.data.logs[0].linkUrl).toBe('https://a.com')
    }
  })

  it('uses default limit of 20', async () => {
    mockSession('pro')
    mockPrisma.auditLog.findMany.mockResolvedValue([])
    mockPrisma.auditLog.count.mockResolvedValue(0)

    await getAuditLogAction({ isPro: true })
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 21 })
    )
  })

  it('supports cursor-based pagination', async () => {
    mockSession('pro')
    // Simulate a second page: only 1 log returned when cursor is used
    mockPrisma.auditLog.findUnique.mockResolvedValue({ createdAt: new Date('2026-07-18T08:00:00Z') })
    mockPrisma.auditLog.findMany.mockResolvedValue([mockLogs[1]])
    mockPrisma.link.findMany.mockResolvedValue(mockLinks)
    mockPrisma.auditLog.count.mockResolvedValue(2)

    const result = await getAuditLogAction({ isPro: true, cursor: 'log-1' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.logs).toHaveLength(1)
      expect(result.data.logs[0].id).toBe('log-2')
    }
  })

  it('returns empty when cursor does not exist', async () => {
    mockSession('pro')
    mockPrisma.auditLog.findUnique.mockResolvedValue(null)

    const result = await getAuditLogAction({ isPro: true, cursor: 'nonexistent' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.logs).toEqual([])
    }
  })

  it('returns hasMore when more logs exist than limit', async () => {
    mockSession('pro')
    // Create 21 logs (limit + 1)
    const manyLogs = Array.from({ length: 21 }, (_, i) => ({
      id: `log-${i}`,
      entityId: 'link-1',
      action: 'create',
      entityType: 'link',
      previousValue: null,
      newValue: {},
      createdAt: new Date(Date.UTC(2026, 6, 19 - i, 10, 0, 0)),
    }))
    mockPrisma.auditLog.findMany.mockResolvedValue(manyLogs)
    mockPrisma.link.findMany.mockResolvedValue(mockLinks)
    mockPrisma.auditLog.count.mockResolvedValue(21)

    const result = await getAuditLogAction({ isPro: true, limit: 20 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.logs).toHaveLength(20)
      expect(result.data.nextCursor).toBe('log-19')
      expect(result.data.totalCount).toBe(21)
    }
  })
})
