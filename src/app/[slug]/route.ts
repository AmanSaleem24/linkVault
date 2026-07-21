import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { getRedis, LINK_CACHE_KEY, LINK_CACHE_TTL, type CachedLink } from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { RESERVED_SLUGS } from '@/lib/validators'

const LINKVAULT_404 = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 — Link Not Found</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fafafa; color: #1F2C5C; }
  .wrap { text-align: center; padding: 2rem; }
  h1 { font-size: 5rem; font-weight: 800; color: #3D52A0; line-height: 1; }
  h2 { margin-top: 1rem; font-size: 1.5rem; font-weight: 600; color: #1F2C5C; }
  p { margin-top: .75rem; max-width: 24rem; margin-inline: auto; font-size: .9375rem; color: #6b7280; line-height: 1.6; }
  a { display: inline-block; margin-top: 2rem; padding: .625rem 1.5rem; background: #3D52A0; color: #fff; text-decoration: none; border-radius: .5rem; font-size: .875rem; font-weight: 500; transition: background .15s; }
  a:hover { background: #2E3F80; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>404</h1>
    <h2>This link doesn't exist</h2>
    <p>The short link you're looking for may have been removed, disabled, or never existed.</p>
    <a href="/">Go to LinkVault</a>
  </div>
</body>
</html>`

// ─── User-Agent Parser ────────────────────────────────────────────────────────

function parseUserAgent(ua: string | undefined): {
  browser: string
  os: string
  device: string
} {
  if (!ua) return { browser: 'unknown', os: 'unknown', device: 'unknown' }

  // Device
  let device: string = 'desktop'
  if (/Mobile|Android|iPhone/.test(ua)) device = 'mobile'
  else if (/Tablet|iPad|PlayBook|Kindle/.test(ua)) device = 'tablet'

  // OS
  let os = 'unknown'
  if (ua.includes('Windows')) os = 'Windows'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'
  else if (ua.includes('Mac OS X')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('CrOS')) os = 'ChromeOS'

  // Browser
  let browser = 'unknown'
  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'
  else if (ua.includes('Vivaldi')) browser = 'Vivaldi'
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet'
  else if (ua.includes('CriOS')) browser = 'Chrome'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Firefox') && !ua.includes('Seamonkey'))
    browser = 'Firefox'

  return { browser, os, device }
}

// ─── Redirect Handler ────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  // Guard: never serve app routes as short links
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return new NextResponse(LINKVAULT_404, {
      status: 404,
      headers: { 'content-type': 'text/html' },
    })
  }

  const country = (request.headers.get('x-country') ??
    request.headers.get('x-vercel-ip-country'))
  // Normalize sentinel values to undefined so Prisma stores null
  const normalizedCountry = country && country !== 'unknown' ? country : undefined
  const userAgent = request.headers.get('user-agent') ?? undefined
  const referer = request.headers.get('referer') ?? undefined
  // Vercel sends the real client IP as the first entry in x-forwarded-for
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    undefined
  const ua = parseUserAgent(userAgent)

  // Parse UTM parameters
  const { searchParams } = new URL(request.url)
  const utmSource = searchParams.get('utm_source') ?? undefined
  const utmMedium = searchParams.get('utm_medium') ?? undefined
  const utmCampaign = searchParams.get('utm_campaign') ?? undefined

  const redis = getRedis()
  const now = new Date()

  // ── Cache-first lookup ────────────────────────────────────────────────────
  if (redis) {
    try {
      const cached = await redis.get<CachedLink>(LINK_CACHE_KEY(slug))
      if (cached && typeof cached === 'object' && cached.originalUrl) {
        const expiresAt = cached.expiresAt ? new Date(cached.expiresAt) : null
        const cachedStatus = cached.status as CachedLink['status']
        if (
          cachedStatus === 'active' &&
          (!expiresAt || expiresAt > now)
        ) {
          // Cache hit — redirect immediately, log analytics async
          after(async () => {
            try {
              const link = await prisma.link.findUnique({
                where: { slug },
                select: { id: true },
              })
              if (!link) return
              await prisma.click.create({
                data: {
                  linkId: link.id,
                  browser: ua.browser,
                  os: ua.os,
                  device: ua.device,
                  country: normalizedCountry,
                  referrer: referer ?? undefined,
                  ip: ip ?? undefined,
                  utmSource,
                  utmMedium,
                  utmCampaign,
                },
              })
              await prisma.link.update({
                where: { id: link.id },
                data: { clickCount: { increment: 1 } },
              })
            } catch {
              // Analytics failure — non-critical
            }
          })
          return NextResponse.redirect(cached.originalUrl, 302)
        }
        // Cached but disabled or expired — fall through to DB
      }
    } catch {
      // Redis failure — fall through to DB
    }
  }

  // ── DB fallback ───────────────────────────────────────────────────────────
  let record: { id: string; originalUrl: string; status: string; expiresAt: Date | null } | null = null
  try {
    record = await prisma.link.findUnique({
      where: { slug },
      select: { id: true, originalUrl: true, status: true, expiresAt: true },
    })
  } catch {
    // DB unreachable — return 404 rather than 500
    return new NextResponse(LINKVAULT_404, {
      status: 404,
      headers: { 'content-type': 'text/html' },
    })
  }

  if (!record) {
    return new NextResponse(LINKVAULT_404, {
      status: 404,
      headers: { 'content-type': 'text/html' },
    })
  }

  if (record.status === 'disabled') {
    return NextResponse.redirect(new URL(`/disabled/${slug}`, request.url))
  }

  if (record.expiresAt && record.expiresAt < now) {
    return NextResponse.redirect(new URL(`/expired/${slug}`, request.url))
  }

  // ── Cache the result ──────────────────────────────────────────────────────
  if (redis) {
    try {
      const cached: CachedLink = {
        originalUrl: record.originalUrl,
        status: record.status as CachedLink['status'],
        expiresAt: record.expiresAt?.toISOString() ?? null,
      }
      await redis.set(LINK_CACHE_KEY(slug), cached, { ex: LINK_CACHE_TTL })
    } catch {
      // Redis failure — non-blocking
    }
  }

  // ── Async analytics (runs after response is sent) ─────────────────────────
  after(async () => {
    if (!record) return
    try {
      await prisma.click.create({
        data: {
          linkId: record.id,
          browser: ua.browser,
          os: ua.os,
          device: ua.device,
          country: normalizedCountry,
          referrer: referer ?? undefined,
          ip: ip ?? undefined,
          utmSource,
          utmMedium,
          utmCampaign,
        },
      })
      await prisma.link.update({
        where: { id: record.id },
        data: { clickCount: { increment: 1 } },
      })
    } catch {
      // Analytics failure — non-critical
    }
  })

  return NextResponse.redirect(record.originalUrl, 302)
}
