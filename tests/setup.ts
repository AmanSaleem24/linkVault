import { vi } from 'vitest'

// Mock next/headers for Vitest since it runs outside of Next.js request scope
vi.mock('next/headers', () => {
  return {
    headers: vi.fn(async () => {
      const headersMap = new Map()
      headersMap.set('x-forwarded-for', '127.0.0.1')
      headersMap.set('x-vercel-ip-country', 'US')
      return headersMap
    })
  }
})
