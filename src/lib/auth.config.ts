import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // We let all requests pass to the middleware function to handle routing
    authorized() {
      return true
    },
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
} satisfies NextAuthConfig

