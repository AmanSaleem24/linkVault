import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getIp } from '@/lib/ratelimit'
import { headers } from 'next/headers'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

describe('getIp', () => {
  const mockHeaders = headers as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts IP from x-forwarded-for', async () => {
    mockHeaders.mockResolvedValue({
      get: (key: string) => (key === 'x-forwarded-for' ? '203.0.113.1, 198.51.100.1' : null),
    })

    const ip = await getIp()
    expect(ip).toBe('203.0.113.1')
  })

  it('falls back to x-real-ip', async () => {
    mockHeaders.mockResolvedValue({
      get: (key: string) => (key === 'x-real-ip' ? '198.51.100.1' : null),
    })

    const ip = await getIp()
    expect(ip).toBe('198.51.100.1')
  })

  it('returns null if neither header is present', async () => {
    mockHeaders.mockResolvedValue({
      get: () => null,
    })

    const ip = await getIp()
    expect(ip).toBeNull()
  })
})
