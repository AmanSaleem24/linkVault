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
    allowExitOnIdle: true
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

export const prisma = globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
