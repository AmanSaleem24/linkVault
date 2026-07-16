import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Extract geo info from Vercel headers and forward it
  const country = req.headers.get('x-vercel-ip-country') ?? 'unknown'

  // Protect authenticated routes (route group pages)
  const isProtected = pathname.startsWith('/home') || pathname.startsWith('/link')
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect logged-in users away from auth pages
  const isAuthPage = ['/login', '/signup'].includes(pathname)
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  const response = NextResponse.next()

  // Forward geo header to downstream route handlers (for click logging)
  response.headers.set('x-country', country)

  return response
})

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
