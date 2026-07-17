import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import dns from 'node:dns'

// Force IPv4 resolution because IPv6 might be blackholed in the environment, causing ETIMEDOUT
dns.setDefaultResultOrder('ipv4first')

const connectionString = process.env.DATABASE_URL

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function makePrismaClient() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 15000,
    max: 10,
    allowExitOnIdle: true,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

const prisma = globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Wraps a Prisma query with retry logic to handle Neon cold starts.
 * Retries on transient connection errors (P1000, P1001) up to 3 times
 * with exponential backoff.
 */
export async function prismaQuery<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  try {
    return await fn()
  } catch (error: unknown) {
    const isRetryable =
      error instanceof Error &&
      (error.message.includes('P1000') ||
        error.message.includes('P1001') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('Server closed the connection') ||
        error.message.includes('Can\'t reach database'))

    if (!isRetryable || retries <= 0) {
      throw error
    }

    await new Promise((resolve) => setTimeout(resolve, delay))
    return prismaQuery(fn, retries - 1, delay * 2)
  }
}

export { prisma }
