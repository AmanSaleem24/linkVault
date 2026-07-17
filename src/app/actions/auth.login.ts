'use server'

import { signIn, signOut } from '@/lib/auth'
import { AuthError } from 'next-auth'

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(formData: unknown) {
  try {
    const { email, password } = formData as any
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
          const cause = (error as any).cause?.err || (error as any).cause
          const msg = cause?.message || error.message

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
