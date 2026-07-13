import type { NextAuthConfig } from 'next-auth'

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
  providers: [], // Populated in auth.ts
} satisfies NextAuthConfig
