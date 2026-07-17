'use server'

import * as crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { signupSchema } from '@/lib/validators'
import { AUTH_TOKEN_EXPIRY_MINUTES, BCRYPT_ROUNDS } from '@/lib/config'

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUpAction(formData: unknown) {
  const result = signupSchema.safeParse(formData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const { name, email, password } = result.data

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email },
    })

    if (existingUser) {
      if (!existingUser.passwordHash) {
        return { success: false, error: 'This email is linked to a Google account. Please sign in with Google.' }
      }
      return { success: false, error: 'Email already registered' }
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + AUTH_TOKEN_EXPIRY_MINUTES * 60 * 1000)

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          emailVerified: null,
        },
      })

      await tx.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })
    })

    try {
      await sendVerificationEmail({ to: email, name, token })
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr)
      if (process.env.NODE_ENV === 'development') {
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
        console.log(`[DEV ONLY] Verification Link: ${verifyUrl}`)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: `Error: ${error instanceof Error ? error.message : String(error)}` }
  }
}
