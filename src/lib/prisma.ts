import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import dns from 'node:dns'

// Force IPv4 resolution because IPv6 might be blackholed in the environment, causing ETIMEDOUT
dns.setDefaultResultOrder('ipv4first')

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
    const errorCode = (error !== null && typeof error === 'object' && 'code' in error)
      ? (error as { code: unknown }).code
      : undefined
    const isRetryable =
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'P1000' ||
      errorCode === 'P1001' ||
      (error instanceof Error &&
        (error.message.includes('P1000') ||
          error.message.includes('P1001') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('Server closed the connection') ||
          error.message.includes('Can\'t reach database')))

    if (!isRetryable || retries <= 0) {
      throw error
    }
    console.warn(`⏳ Retryable DB error, retrying in ${delay}ms... (${retries} left)`)
    await new Promise((resolve) => setTimeout(resolve, delay))
    return prismaQuery(fn, retries - 1, delay * 2)
  }
}

function makePrismaClient() {
   console.log('🔵 makePrismaClient called — instance id:', Math.random().toString(36).slice(2))
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Prisma will fail to connect.");
  }
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 15000,
    max: 10,
    allowExitOnIdle: true,
  })
  const adapter = new PrismaPg(pool)
  
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, query, args }) {
          const safeReadOperations = [
            'findUnique',
            'findUniqueOrThrow',
            'findFirst',
            'findFirstOrThrow',
            'findMany',
            'count',
            'aggregate',
            'groupBy',
          ]

          if (safeReadOperations.includes(operation)) {
            return prismaQuery(() => query(args))
          }

          // Do not retry mutations
          return query(args)
        },
      },
    },
  })
}

type ExtendedPrismaClient = ReturnType<typeof makePrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }
