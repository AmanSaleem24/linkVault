import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { customFetch } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validators'
import { authConfig } from './auth.config'

// Custom errors will be thrown as standard Error objects so we can read error.cause?.err?.message

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    // Override the Google provider from authConfig with a custom fetch that
    // allows up to 30s — prevents intermittent ConnectTimeoutError on slow networks.
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      [customFetch]: (url: Parameters<typeof fetch>[0], opts?: Parameters<typeof fetch>[1]) =>
        fetch(url, { ...opts, signal: AbortSignal.timeout(30_000) }),
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
          })

          if (!user) return null

          // User signed up with Google and has no password
          if (!user.passwordHash) {
            throw new Error('OAUTH_ACCOUNT_NO_PASSWORD')
          }

          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
          if (!valid) return null

          if (!user.emailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED')
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }
        } catch (err) {
          // Log unexpected errors (e.g. Neon cold-start timeout) and return null
          // so Auth.js shows a CredentialsSignin error, not a Configuration error
          console.error('[authorize] unexpected error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? token.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token && token.id) {
        session.user.id = token.id as string
        
        try {
          // Always fetch fresh data from DB to handle upgrades and profile updates without re-login
          const dbUser = await prisma.user.findUnique({ 
            where: { id: token.id as string }, 
            select: { role: true, name: true, email: true } 
          })
          if (dbUser) {
            // @ts-expect-error — extend session type
            session.user.role = dbUser.role
            session.user.name = dbUser.name
            session.user.email = dbUser.email
          } else {
            // Fallback to JWT token
            // @ts-expect-error session.user.role is read-only in type but assigned here
            session.user.role = token.role as string
          }
        } catch {
          // Fallback to JWT token role if DB query fails
          // @ts-expect-error session.user.role is read-only in type but assigned here
          session.user.role = token.role as string
        }
      }
      return session
    },
  },
})

