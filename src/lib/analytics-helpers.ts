// Shared helpers for both per-link and account-level analytics.

// ─── Country name mapping ─────────────────────────────────────────────────────

export const COUNTRY_NAMES: Record<string, string> = {
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

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatCountry(code: string | null): string {
  if (!code) return 'Unknown'
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase()
}

export function formatReferrer(referrer: string | null): string {
  if (!referrer) return 'Direct'
  try {
    const u = new URL(referrer)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return referrer.slice(0, 40)
  }
}

export function formatDevice(device: string | null): string {
  if (!device) return 'Unknown'
  const map: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' }
  return map[device] ?? device.charAt(0).toUpperCase() + device.slice(1)
}

export function formatBrowser(browser: string | null): string {
  if (!browser) return 'Unknown'
  return browser.charAt(0).toUpperCase() + browser.slice(1)
}

// ─── Time-series zero-fill ────────────────────────────────────────────────────

export type TimeSeriesPoint = { date: string; count: number }
export type DateRange = { from: Date; to: Date }

export function fillTimeSeries(
  raw: Array<{ clickedAt: Date | string }>,
  range: DateRange
): Array<{ date: string; count: number }> {
  const days: Array<{ date: string; count: number }> = []
  const cursor = new Date(
    Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), range.from.getUTCDate())
  )
  const end = new Date(
    Date.UTC(range.to.getUTCFullYear(), range.to.getUTCMonth(), range.to.getUTCDate())
  )

  while (cursor <= end) {
    days.push({ date: cursor.toISOString().slice(0, 10), count: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const bucket = new Map(days.map((d) => [d.date, d]))
  for (const row of raw) {
    const iso = typeof row.clickedAt === 'string' ? row.clickedAt : row.clickedAt.toISOString()
    const key = iso.slice(0, 10)
    const found = bucket.get(key)
    if (found) found.count++
  }

  return days
}

// ─── Date presets ─────────────────────────────────────────────────────────────

export const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
] as const

export function rangeFromDays(days: number): DateRange {
  const to = new Date()
  to.setUTCHours(23, 59, 59, 999)
  const from = new Date()
  from.setUTCDate(from.getUTCDate() - (days - 1))
  from.setUTCHours(0, 0, 0, 0)
  return { from, to }
}

// ─── groupBy → ranked rows helper ─────────────────────────────────────────────

export function toRankedRows<T extends string | null>(
  groups: Array<{ key: T; count: number }>,
  formatter: (key: T) => string
): Array<{ name: string; count: number; percentage: number }> {
  const filtered = groups.filter((g) => g.key !== null)
  const total = filtered.reduce((sum, g) => sum + g.count, 0) || 1
  return filtered
    .map((g) => ({
      name: formatter(g.key),
      count: g.count,
      percentage: (g.count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
}
