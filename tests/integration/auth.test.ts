import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { signUpAction, verifyEmailAction, forgotPasswordAction, resetPasswordAction } from '@/app/actions/auth'
import { prisma, prismaQuery } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

// Mock the email sending functions to avoid actual API calls to Resend during test execution
vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ id: 'mock-id' }),
}))

// Mock Next-Auth and @/lib/auth to avoid loading next/server in Vitest Node environment
vi.mock('next-auth', () => {
  class MockAuthError extends Error {
    type: string
    constructor(type: string) {
      super(type)
      this.type = type
    }
  }
  return {
    default: vi.fn(),
    AuthError: MockAuthError,
  }
})

vi.mock('@/lib/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
  auth: vi.fn(),
}))

describe('Auth Integration Tests', { timeout: 30_000 }, () => {
  const testEmail = 'integration-test@example.com'
  const testPassword = 'Password1'

  beforeAll(async () => {
    // Warm up Neon database to prevent cold-start timeouts on the first test
    // We use the native pg Pool here to avoid Prisma's aggressive stdout error logging on cold start timeouts.
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
    })
    pool.on('error', () => { /* ignore background connection errors during warmup */ })
    for (let i = 0; i < 5; i++) {
      try {
        await pool.query('SELECT 1')
        break
      } catch (e) {
        if (i === 4) throw e
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    await pool.end()
  }, 30_000)

  // Clean up any test users before and after
  beforeEach(async () => {
    await prismaQuery(() => prisma.user.deleteMany({ where: { email: testEmail } }))
    await prismaQuery(() => prisma.verificationToken.deleteMany({ where: { identifier: testEmail } }))
  })

  afterEach(async () => {
    await prismaQuery(() => prisma.user.deleteMany({ where: { email: testEmail } }))
    await prismaQuery(() => prisma.verificationToken.deleteMany({ where: { identifier: testEmail } }))
  })

  it('should sign up a user and generate verification token', async () => {
    const res = await signUpAction({
      name: 'Test User',
      email: testEmail,
      password: testPassword,
    })

    expect(res.success).toBe(true)

    const user = await prismaQuery(() => prisma.user.findUnique({
      where: { email: testEmail },
    }))
    expect(user).toBeDefined()
    expect(user?.emailVerified).toBeNull()
    expect(user?.name).toBe('Test User')

    const token = await prismaQuery(() => prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    }))
    expect(token).toBeDefined()
    expect(token?.token).toBeDefined()
  })

  it('should verify a user email with a valid token', async () => {
    await signUpAction({
      name: 'Test User',
      email: testEmail,
      password: testPassword,
    })

    const vt = await prismaQuery(() => prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    }))
    expect(vt).toBeDefined()

    const verifyRes = await verifyEmailAction(vt!.token)
    expect(verifyRes.success).toBe(true)

    const user = await prismaQuery(() => prisma.user.findUnique({
      where: { email: testEmail },
    }))
    expect(user?.emailVerified).toBeInstanceOf(Date)

    const tokenExists = await prismaQuery(() => prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    }))
    expect(tokenExists).toBeNull()
  })

  it('should not verify with an invalid token', async () => {
    const verifyRes = await verifyEmailAction('non-existent-token')
    expect(verifyRes.success).toBe(false)
    expect(verifyRes.error).toBe('Invalid verification token')
  })

  it('should handle forgot password and reset password successfully', async () => {
    await signUpAction({
      name: 'Test User',
      email: testEmail,
      password: testPassword,
    })
    await prismaQuery(() => prisma.user.update({
      where: { email: testEmail },
      data: { emailVerified: new Date() },
    }))

    const forgotRes = await forgotPasswordAction({ email: testEmail })
    expect(forgotRes.success).toBe(true)

    const vt = await prismaQuery(() => prisma.verificationToken.findFirst({
      where: { identifier: testEmail },
    }))
    expect(vt).toBeDefined()

    const resetRes = await resetPasswordAction({
      token: vt!.token,
      password: 'NewPassword2',
      confirmPassword: 'NewPassword2',
    })
    expect(resetRes.success).toBe(true)

    const user = await prismaQuery(() => prisma.user.findUnique({
      where: { email: testEmail },
    }))
    expect(user).toBeDefined()
    const valid = await bcrypt.compare('NewPassword2', user!.passwordHash!)
    expect(valid).toBe(true)
  })
})
