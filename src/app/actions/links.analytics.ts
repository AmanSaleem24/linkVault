'use server'

import { cache } from 'react'
import { auth } from '@/lib/auth'
import { prisma, prismaQuery } from '@/lib/prisma'
import { type LinkStatus } from '@/lib/validators'
import {
  formatCountry,
  formatReferrer,
  formatDevice,
  formatBrowser,
  fillTimeSeries,
  toRankedRows,
  type DateRange,
  type TimeSeriesPoint,
} from '@/lib/analytics-helpers'
export type { DateRange, TimeSeriesPoint } from '@/lib/analytics-helpers'
import type { SegmentRow } from '@/components/dashboard/charts/types'

// ─── Types (re-exported for barrel file & consumers) ─────────────────────────

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

export type CountryData = SegmentRow
export type ReferrerData = SegmentRow
export type DeviceData = SegmentRow

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
    const link = await prismaQuery(() => prisma.link.findUnique({
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
    }))

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
    const link = await prismaQuery(() => prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    }))

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const clicksResult = await prismaQuery(() => prisma.click.count({ where: { linkId } }))
    const uniqueResult = await prismaQuery(() => prisma.click.groupBy({
      by: ['ip'],
      where: { linkId },
      _count: { ip: true },
    }))

    const topCountryResult = await prismaQuery(() => prisma.click.groupBy({
      by: ['country'],
      where: { linkId },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 1,
    }))

    const topDeviceResult = await prismaQuery(() => prisma.click.groupBy({
      by: ['device'],
      where: { linkId },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
      take: 1,
    }))

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
  } catch (error) {
    console.error('getClickAnalyticsAction error:', error)
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
    const link = await prismaQuery(() => prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    }))

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const raw = await prismaQuery(() => prisma.click.findMany({
      where: { linkId, clickedAt: { gte: range.from, lte: range.to } },
      select: { clickedAt: true },
      orderBy: { clickedAt: 'asc' },
    }))

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
    const link = await prismaQuery(() => prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    }))

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const grouped = await prismaQuery(() => prisma.click.groupBy({
      by: ['country'],
      where: { linkId },
      _count: { country: true },
    }))

    const merged = new Map<string, number>()
    let total = 0
    for (const g of grouped) {
      const name = formatCountry(g.country)
      const count = g._count.country
      merged.set(name, (merged.get(name) || 0) + count)
      total += count
    }

    const data: CountryData[] = Array.from(merged.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

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
    const link = await prismaQuery(() => prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    }))

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const grouped = await prismaQuery(() => prisma.click.groupBy({
      by: ['referrer'],
      where: { linkId },
      _count: { referrer: true },
    }))

    const merged = new Map<string, number>()
    let total = 0
    for (const g of grouped) {
      const name = formatReferrer(g.referrer ?? 'Direct')
      const count = g._count.referrer
      merged.set(name, (merged.get(name) || 0) + count)
      total += count
    }

    const data: ReferrerData[] = Array.from(merged.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

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
    const link = await prismaQuery(() => prisma.link.findUnique({
      where: { id: linkId },
      select: { userId: true },
    }))

    if (!link || link.userId !== session.user.id) {
      return { success: false as const, error: 'Link not found' }
    }

    const grouped = await prismaQuery(() => prisma.click.groupBy({
      by: ['device'],
      where: { linkId },
      _count: { device: true },
    }))

    const merged = new Map<string, number>()
    let total = 0
    for (const g of grouped) {
      const name = formatDevice(g.device)
      const count = g._count.device
      merged.set(name, (merged.get(name) || 0) + count)
      total += count
    }

    const data: DeviceData[] = Array.from(merged.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return { success: true, data }
  } catch {
    return { success: false as const, error: 'Failed to fetch devices' }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Account-wide analytics (aggregated across all of the user's links)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Internal helpers ─────────────────────────────────────────────────────────

const requireUserId = cache(async (): Promise<{ userId: string } | { error: string }> => {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Not authenticated' }
  return { userId: session.user.id }
})

const getUserLinkIds = cache(async (userId: string): Promise<string[]> => {
  const links = await prismaQuery(() => prisma.link.findMany({
    where: { userId },
    select: { id: true },
  }))
  return links.map((l) => l.id)
})

// ─── 1. Account analytics summary ─────────────────────────────────────────────

export interface AccountAnalyticsData {
  totalClicks: number
  totalLinks: number
  activeLinks: number
  disabledLinks: number
  expiredLinks: number
  uniqueVisitors: number
  topCountry: { name: string; count: number } | null
  topDevice: { name: string; count: number } | null
  topReferrer: { name: string; count: number } | null
}

export async function getAccountAnalyticsAction(): Promise<
  { success: true; data: AccountAnalyticsData } | { success: false; error: string }
> {
  const authResult = await requireUserId()
  if ('error' in authResult) return { success: false, error: authResult.error }
  const { userId } = authResult

  try {
    const [statusCounts, linkIds] = await Promise.all([
      prismaQuery(() => prisma.link.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      })),
      getUserLinkIds(userId),
    ])

    const counts: Record<string, number> = { active: 0, disabled: 0, expired: 0 }
    for (const g of statusCounts) {
      counts[g.status] = g._count.status
    }

    if (linkIds.length === 0) {
      return {
        success: true,
        data: {
          totalClicks: 0,
          totalLinks: 0,
          activeLinks: counts.active,
          disabledLinks: counts.disabled,
          expiredLinks: counts.expired,
          uniqueVisitors: 0,
          topCountry: null,
          topDevice: null,
          topReferrer: null,
        },
      }
    }

    const [totalClicks, uniqueIpRows, topCountryGroup, topDeviceGroup, topReferrerGroup] =
      await Promise.all([
        prismaQuery(() => prisma.click.count({ where: { linkId: { in: linkIds } } })),
        prismaQuery(() => prisma.click.findMany({
          where: { linkId: { in: linkIds } },
          select: { ip: true },
          distinct: ['ip'],
        })),
        prismaQuery(() => prisma.click.groupBy({
          by: ['country'],
          where: { linkId: { in: linkIds } },
          _count: { country: true },
          orderBy: { _count: { country: 'desc' } },
          take: 1,
        })),
        prismaQuery(() => prisma.click.groupBy({
          by: ['device'],
          where: { linkId: { in: linkIds } },
          _count: { device: true },
          orderBy: { _count: { device: 'desc' } },
          take: 1,
        })),
        prismaQuery(() => prisma.click.groupBy({
          by: ['referrer'],
          where: { linkId: { in: linkIds } },
          _count: { referrer: true },
          orderBy: { _count: { referrer: 'desc' } },
          take: 1,
        })),
      ])

    return {
      success: true,
      data: {
        totalClicks,
        totalLinks: counts.active + counts.disabled + counts.expired,
        activeLinks: counts.active,
        disabledLinks: counts.disabled,
        expiredLinks: counts.expired,
        uniqueVisitors: uniqueIpRows.filter((r) => r.ip).length,
        topCountry: topCountryGroup[0]
          ? {
              name: formatCountry(topCountryGroup[0].country),
              count: topCountryGroup[0]._count.country,
            }
          : null,
        topDevice: topDeviceGroup[0]
          ? {
              name: formatDevice(topDeviceGroup[0].device),
              count: topDeviceGroup[0]._count.device,
            }
          : null,
        topReferrer: topReferrerGroup[0]
          ? {
              name: formatReferrer(topReferrerGroup[0].referrer),
              count: topReferrerGroup[0]._count.referrer,
            }
          : null,
      },
    }
  } catch (err) {
    console.error('[getAccountAnalyticsAction]', err)
    return { success: false, error: 'Failed to fetch analytics' }
  }
}

// ─── 2. Account time series ───────────────────────────────────────────────────

export async function getAccountTimeSeriesAction(
  range: DateRange
): Promise<
  { success: true; data: Array<{ date: string; count: number }> } | { success: false; error: string }
> {
  const authResult = await requireUserId()
  if ('error' in authResult) return { success: false, error: authResult.error }
  const { userId } = authResult

  try {
    const linkIds = await getUserLinkIds(userId)
    if (linkIds.length === 0) return { success: true, data: fillTimeSeries([], range) }

    const clicks = await prismaQuery(() => prisma.click.findMany({
      where: {
        linkId: { in: linkIds },
        clickedAt: { gte: range.from, lte: range.to },
      },
      select: { clickedAt: true },
    }))

    return { success: true, data: fillTimeSeries(clicks, range) }
  } catch (err) {
    console.error('[getAccountTimeSeriesAction]', err)
    return { success: false, error: 'Failed to fetch time series' }
  }
}

// ─── 3. Top performing links ──────────────────────────────────────────────────

export interface TopLinkRow {
  id: string
  slug: string
  originalUrl: string
  clickCount: number
  status: 'active' | 'disabled' | 'expired'
}

export async function getAccountTopLinksAction(
  limit = 10
): Promise<
  { success: true; data: TopLinkRow[] } | { success: false; error: string }
> {
  const authResult = await requireUserId()
  if ('error' in authResult) return { success: false, error: authResult.error }
  const { userId } = authResult

  try {
    const links = await prismaQuery(() => prisma.link.findMany({
      where: { userId },
      orderBy: { clickCount: 'desc' },
      take: limit,
      select: {
        id: true,
        slug: true,
        originalUrl: true,
        clickCount: true,
        status: true,
      },
    }))

    return {
      success: true,
      data: links.map((l) => ({
        ...l,
        status: l.status as TopLinkRow['status'],
      })),
    }
  } catch (err) {
    console.error('[getAccountTopLinksAction]', err)
    return { success: false, error: 'Failed to fetch top links' }
  }
}

// ─── 4. Top locations ─────────────────────────────────────────────────────────

export async function getAccountLocationsAction(): Promise<
  {
    success: true
    data: Array<{ name: string; count: number; percentage: number }>
  } | { success: false; error: string }
> {
  const authResult = await requireUserId()
  if ('error' in authResult) return { success: false, error: authResult.error }
  const { userId } = authResult

  try {
    const linkIds = await getUserLinkIds(userId)
    if (linkIds.length === 0) return { success: true, data: [] }

    const groups = await prismaQuery(() => prisma.click.groupBy({
      by: ['country'],
      where: { linkId: { in: linkIds } },
      _count: { country: true },
    }))

    const rows = toRankedRows(
      groups.map((g) => ({ key: g.country, count: g._count.country })),
      formatCountry
    )
    return { success: true, data: rows }
  } catch (err) {
    console.error('[getAccountLocationsAction]', err)
    return { success: false, error: 'Failed to fetch locations' }
  }
}

// ─── 5. Top referrers ─────────────────────────────────────────────────────────

export async function getAccountReferrersAction(): Promise<
  {
    success: true
    data: Array<{ name: string; count: number; percentage: number }>
  } | { success: false; error: string }
> {
  const authResult = await requireUserId()
  if ('error' in authResult) return { success: false, error: authResult.error }
  const { userId } = authResult

  try {
    const linkIds = await getUserLinkIds(userId)
    if (linkIds.length === 0) return { success: true, data: [] }

    const groups = await prismaQuery(() => prisma.click.groupBy({
      by: ['referrer'],
      where: { linkId: { in: linkIds } },
      _count: { referrer: true },
    }))

    const rows = toRankedRows(
      groups.map((g) => ({ key: g.referrer ?? 'Direct', count: g._count.referrer })),
      formatReferrer
    )
    return { success: true, data: rows }
  } catch (err) {
    console.error('[getAccountReferrersAction]', err)
    return { success: false, error: 'Failed to fetch referrers' }
  }
}

// ─── 6. Top devices + browsers ────────────────────────────────────────────────

export async function getAccountDevicesAction(): Promise<
  {
    success: true
    data: {
      devices: Array<{ name: string; count: number; percentage: number }>
      browsers: Array<{ name: string; count: number; percentage: number }>
    }
  } | { success: false; error: string }
> {
  const authResult = await requireUserId()
  if ('error' in authResult) return { success: false, error: authResult.error }
  const { userId } = authResult

  try {
    const linkIds = await getUserLinkIds(userId)
    if (linkIds.length === 0) return { success: true, data: { devices: [], browsers: [] } }

    const [deviceGroups, browserGroups] = await Promise.all([
      prismaQuery(() => prisma.click.groupBy({
        by: ['device'],
        where: { linkId: { in: linkIds } },
        _count: { device: true },
      })),
      prismaQuery(() => prisma.click.groupBy({
        by: ['browser'],
        where: { linkId: { in: linkIds } },
        _count: { browser: true },
      })),
    ])

    return {
      success: true,
      data: {
        devices: toRankedRows(
          deviceGroups.map((g) => ({ key: g.device, count: g._count.device })),
          formatDevice
        ),
        browsers: toRankedRows(
          browserGroups.map((g) => ({ key: g.browser, count: g._count.browser })),
          formatBrowser
        ),
      },
    }
  } catch (err) {
    console.error('[getAccountDevicesAction]', err)
    return { success: false, error: 'Failed to fetch devices' }
  }
}

// ─── 7. Link status breakdown ─────────────────────────────────────────────────

export async function getAccountStatusBreakdownAction(): Promise<
  {
    success: true
    data: Array<{ name: string; count: number; percentage: number }>
  } | { success: false; error: string }
> {
  const authResult = await requireUserId()
  if ('error' in authResult) return { success: false, error: authResult.error }
  const { userId } = authResult

  try {
    const groups = await prismaQuery(() => prisma.link.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    }))

    const labels: Record<string, string> = {
      active: 'Active',
      disabled: 'Disabled',
      expired: 'Expired',
    }

    const rows = toRankedRows(
      groups.map((g) => ({ key: g.status, count: g._count.status })),
      (key) => labels[key] ?? key
    )
    return { success: true, data: rows }
  } catch (err) {
    console.error('[getAccountStatusBreakdownAction]', err)
    return { success: false, error: 'Failed to fetch status breakdown' }
  }
}
