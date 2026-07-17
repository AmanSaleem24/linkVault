'use server'

import * as crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validators'
import { PASSWORD_RESET_TOKEN_EXPIRY_MINUTES, BCRYPT_ROUNDS } from '@/lib/config'

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(formData: unknown) {
  const result = forgotPasswordSchema.safeParse(formData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid email' }
  }

  const { email } = result.data

  try {
    const user = await prisma.user.findFirst({
      where: { email },
    })

    if (!user) {
      return { success: true }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000) // configured via env

    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    }).catch(() => {})

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    try {
      await sendPasswordResetEmail({ to: email, name: user.name, token })
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr)
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
        console.log(`[DEV ONLY] Password Reset Link: ${resetUrl}`)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Forgot password error:', error)
    return { success: false, error: 'Something went wrong.' }
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(formData: unknown) {
  const result = resetPasswordSchema.safeParse(formData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const { token, password } = result.data

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return { success: false, error: 'Invalid or expired reset token' }
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      }).catch(() => {})
      return { success: false, error: 'Reset token has expired' }
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error('Reset password error:', error)
    return { success: false, error: 'Failed to reset password.' }
  }
}
