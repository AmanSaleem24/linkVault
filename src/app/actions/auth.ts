'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'
import { signupSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validators'
import { AuthError } from 'next-auth'

export async function signUpAction(formData: unknown) {
  const result = signupSchema.safeParse(formData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid input' }
  }

  const { name, email, password } = result.data

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 60 * 1000)

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
    return { success: false, error: 'Something went wrong. Please try again.' }
  }
}

export async function verifyEmailAction(token: string) {
  if (!token) {
    return { success: false, error: 'Token is required' }
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return { success: false, error: 'Invalid verification token' }
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      }).catch(() => {})
      return { success: false, error: 'Verification token has expired' }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ])

    return { success: true }
  } catch (error) {
    console.error('Email verification error:', error)
    return { success: false, error: 'Failed to verify email.' }
  }
}

export async function loginAction(formData: unknown) {
  try {
    const { email, password } = formData as any
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid credentials' }
        case 'CallbackRouteError':
          if (error.cause?.err?.message === 'EMAIL_NOT_VERIFIED') {
            return { success: false, error: 'EMAIL_NOT_VERIFIED' }
          }
          if (error.cause?.err?.message === 'OAUTH_ACCOUNT_NO_PASSWORD') {
            return { success: false, error: 'This email is linked to a Google account. Please sign in with Google.' }
          }
          return { success: false, error: 'Invalid credentials' }
        default:
          return { success: false, error: 'Authentication failed' }
        }
    }
    throw error
  }
}

export async function googleSignInAction() {
  await signIn('google', { redirectTo: '/dashboard' })
}

export async function forgotPasswordAction(formData: unknown) {
  const result = forgotPasswordSchema.safeParse(formData)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || 'Invalid email' }
  }

  const { email } = result.data

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { success: true }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

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

    const passwordHash = await bcrypt.hash(password, 10)

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
