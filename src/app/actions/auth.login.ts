'use server'

import { signIn, signOut } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { loginSchema } from '@/lib/validators'
import { authIpLimiter, authEmailLimiter, getIp } from '@/lib/ratelimit'

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: unknown) {
  const parsed = loginSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: 'Invalid email or password' }
  }
  const { email, password } = parsed.data

  const ip = await getIp()
  if (ip) {
    const { success } = await authIpLimiter.limit(ip)
    if (!success) {
      return { success: false, error: 'Too many login attempts. Please try again later.' }
    }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const { success: emailSuccess } = await authEmailLimiter.limit(normalizedEmail)
  if (!emailSuccess) {
    return { success: false, error: 'Too many login attempts. Please try again later.' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/home',
    })
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
        case 'CallbackRouteError': {
          const cause = error.cause as { err?: { message?: string }; message?: string } | undefined
          const msg = cause?.err?.message || cause?.message || error.message

          if (msg === 'OAUTH_ACCOUNT_NO_PASSWORD') {
            return { success: false, error: 'This email is linked to a Google account. Please sign in with Google.' }
          }
          if (msg === 'EMAIL_NOT_VERIFIED') {
            return { success: false, error: 'EMAIL_NOT_VERIFIED' }
          }

          if (error.type === 'CredentialsSignin') {
            return { success: false, error: 'Invalid email or password' }
          }
          return { success: false, error: 'Authentication failed. Please try again.' }
        }
        default:
          return { success: false, error: 'Authentication failed' }
      }
    }
    throw error
  }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export async function googleSignInAction() {
  await signIn('google', { redirectTo: '/home' })
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}
