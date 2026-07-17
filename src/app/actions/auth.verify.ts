'use server'

import { prisma } from '@/lib/prisma'

// ─── Verify Email ─────────────────────────────────────────────────────────────

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
