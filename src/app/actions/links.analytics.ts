'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type LinkStatus } from '@/lib/validators'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkDetailData {
  id: string
  originalUrl: string
  slug: string
  status: LinkStatus
  clickCount: number
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ClickAnalytics {
  totalClicks: number
  uniqueVisitors: number
  topCountry: { name: string; count: number } | null
  topDevice: { name: string; count: number } | null
}

export interface TimeSeriesPoint {
  date: string
  count: number
}

export interface CountryData {
  name: string
  count: number
  percentage: number
}

export interface ReferrerData {
  name: string
  count: number
  percentage: number
}

export interface DeviceData {
  name: string
  count: number
  percentage: number
}

export interface DateRange {
  id: string
  from: Date
  to: Date
  label: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', DE: 'Germany',
  FR: 'France', AU: 'Australia', IN: 'India', JP: 'Japan', BR: 'Brazil',
  NL: 'Netherlands', ES: 'Spain', IT: 'Italy', MX: 'Mexico', SE: 'Sweden',
  NO: 'Norway', DK: 'Denmark', FI: 'Finland', PL: 'Poland', RU: 'Russia',
  CN: 'China', KR: 'South Korea', SG: 'Singapore', NZ: 'New Zealand',
  IE: 'Ireland', BE: 'Belgium', AT: 'Austria', CH: 'Switzerland',
  PT: 'Portugal', GR: 'Greece', CZ: 'Czech Republic', RO: 'Romania',
  HU: 'Hungary', UA: 'Ukraine', TR: 'Turkey', IL: 'Israel', ZA: 'South Africa',
  AE: 'United Arab Emirates', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
  PH: 'Philippines', TH: 'Thailand', VN: 'Vietnam', ID: 'Indonesia',
  MY: 'Malaysia', HK: 'Hong Kong', TW: 'Taiwan', PK: 'Pakistan',
  BD: 'Bangladesh', NG: 'Nigeria', EG: 'Egypt', KE: 'Kenya',
}

function formatCountry(code: string | null): string {
  if (!code) return 'Unknown'
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase()
}

function formatReferrer(referrer: string | null): string {
  if (!referrer) return 'Direct'
  try {
    const u = new URL(referrer)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return referrer.slice(0, 40)
  }
}

function formatDevice(device: string): string {
  const map: Record<string, string> = {
    desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet',
  }
  return map[device] ?? device.charAt(0).toUpperCase() + device.slice(1)
}

function fillTimeSeries(raw: Array<{ clickedAt: string }>, range: DateRange): TimeSeriesPoint[] {
  const days: TimeSeriesPoint[] = []
  const cursor = new Date(range.from)
  while (cursor <= range.to) {
    const key = cursor.toISOString().slice(0, 10)
    days.push({ date: key, count: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  for (const row of raw) {
    const key = row.clickedAt.slice(0, 10)
    const found = days.find(d => d.date === key)
    if (found) found.count++
  }
  return days
}

// ─── Get Link Detail ──────────────────────────────────────────────────────────

export async function getLinkDetailAction(linkId: string): Promise<{
  success: true
  data: LinkDetailData
} | {
  success: false
  error: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        originalUrl: true,
        slug: true,
        status: true,
        clickCount: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    })

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    return {
      success: true,
      data: {
        id: link.id,
        originalUrl: link.originalUrl,
        slug: link.slug,
        status: link.status as LinkStatus,
        clickCount: link.clickCount,
        expiresAt: link.expiresAt?.toISOString() ?? null,
        createdAt: link.createdAt.toISOString(),
        updatedAt: link.updatedAt.toISOString(),
      },
    }
  } catch {
    return { success: false as const, error: 'Failed to fetch link' }
  }
}

// ─── Get Click Analytics ──────────────────────────────────────────────────────

export async function getClickAnalyticsAction(linkId: string): Promise<{
  success: true
  data: ClickAnalytics
} | {
  success: false
  error: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    })

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const [clicksResult, uniqueResult] = await Promise.all([
      prisma.click.count({ where: { linkId } }),
      prisma.click.groupBy({
        by: ['ip'],
        where: { linkId },
        _count: { ip: true },
      }),
    ])

    const topCountryResult = await prisma.click.groupBy({
      by: ['country'],
      where: { linkId },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 1,
    })

    const topDeviceResult = await prisma.click.groupBy({
      by: ['device'],
      where: { linkId },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
      take: 1,
    })

    return {
      success: true,
      data: {
        totalClicks: clicksResult,
        uniqueVisitors: uniqueResult.length,
        topCountry: topCountryResult[0]
          ? { name: formatCountry(topCountryResult[0].country), count: topCountryResult[0]._count.country }
          : null,
        topDevice: topDeviceResult[0]
          ? { name: formatDevice(topDeviceResult[0].device), count: topDeviceResult[0]._count.device }
          : null,
      },
    }
  } catch {
    return { success: false as const, error: 'Failed to fetch analytics' }
  }
}

// ─── Get Time Series ──────────────────────────────────────────────────────────

export async function getTimeSeriesAction(
  linkId: string,
  range: DateRange
): Promise<{
  success: true
  data: TimeSeriesPoint[]
} | {
  success: false
  error: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    })

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const raw = await prisma.click.findMany({
      where: { linkId, clickedAt: { gte: range.from, lte: range.to } },
      select: { clickedAt: true },
      orderBy: { clickedAt: 'asc' },
    })

    const serialized = raw.map(r => ({ clickedAt: r.clickedAt.toISOString() }))
    return { success: true, data: fillTimeSeries(serialized, range) }
  } catch {
    return { success: false as const, error: 'Failed to fetch time series' }
  }
}

// ─── Get Locations ────────────────────────────────────────────────────────────

export async function getLocationsAction(linkId: string): Promise<{
  success: true
  data: CountryData[]
} | {
  success: false
  error: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    })

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const grouped = await prisma.click.groupBy({
      by: ['country'],
      where: { linkId },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 20,
    })

    const total = grouped.reduce((sum, g) => sum + g._count.country, 0)

    const data: CountryData[] = grouped.map(g => ({
      name: formatCountry(g.country),
      count: g._count.country,
      percentage: total > 0 ? Math.round((g._count.country / total) * 100) : 0,
    }))

    return { success: true, data }
  } catch {
    return { success: false as const, error: 'Failed to fetch locations' }
  }
}

// ─── Get Referrers ────────────────────────────────────────────────────────────

export async function getReferrersAction(linkId: string): Promise<{
  success: true
  data: ReferrerData[]
} | {
  success: false
  error: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    })

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const grouped = await prisma.click.groupBy({
      by: ['referrer'],
      where: { linkId, referrer: { not: null } },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 10,
    })

    const total = grouped.reduce((sum, g) => sum + g._count.referrer, 0)

    const data: ReferrerData[] = grouped.map(g => ({
      name: formatReferrer(g.referrer ?? 'Direct'),
      count: g._count.referrer,
      percentage: total > 0 ? Math.round((g._count.referrer / total) * 100) : 0,
    }))

    return { success: true, data }
  } catch {
    return { success: false as const, error: 'Failed to fetch referrers' }
  }
}

// ─── Get Devices ──────────────────────────────────────────────────────────────

export async function getDevicesAction(linkId: string): Promise<{
  success: true
  data: DeviceData[]
} | {
  success: false
  error: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'You must be logged in' }
  }

  try {
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    })

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const grouped = await prisma.click.groupBy({
      by: ['device'],
      where: { linkId },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
    })

    const total = grouped.reduce((sum, g) => sum + g._count.device, 0)

    const data: DeviceData[] = grouped.map(g => ({
      name: formatDevice(g.device),
      count: g._count.device,
      percentage: total > 0 ? Math.round((g._count.device / total) * 100) : 0,
    }))

    return { success: true, data }
  } catch {
    return { success: false as const, error: 'Failed to fetch devices' }
  }
}
