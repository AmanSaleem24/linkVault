import { describe, it, expect } from 'vitest'
import {
  formatCountry,
  formatReferrer,
  formatDevice,
  formatBrowser,
  fillTimeSeries,
  rangeFromDays,
  toRankedRows,
  type DateRange,
} from '@/lib/analytics-helpers'

// ─── formatCountry ────────────────────────────────────────────────────────────

describe('formatCountry', () => {
  it('maps known codes to names', () => {
    expect(formatCountry('US')).toBe('United States')
    expect(formatCountry('GB')).toBe('United Kingdom')
    expect(formatCountry('IN')).toBe('India')
  })

  it('uppercases the input', () => {
    expect(formatCountry('us')).toBe('United States')
    expect(formatCountry('gb')).toBe('United Kingdom')
  })

  it('falls back to the code for unknown countries', () => {
    expect(formatCountry('XX')).toBe('XX')
    expect(formatCountry('')).toBe('Unknown')
  })

  it('returns "Unknown" for null', () => {
    expect(formatCountry(null)).toBe('Unknown')
  })

  it('returns "Unknown" for undefined', () => {
    // @ts-expect-error mock Prisma typing
    expect(formatCountry(undefined)).toBe('Unknown')
  })
})

// ─── formatReferrer ───────────────────────────────────────────────────────────

describe('formatReferrer', () => {
  it('extracts hostname from a URL', () => {
    expect(formatReferrer('https://twitter.com/some/path')).toBe('twitter.com')
    expect(formatReferrer('https://www.google.com')).toBe('google.com')
  })

  it('strips the www prefix', () => {
    expect(formatReferrer('https://www.reddit.com/r/test')).toBe('reddit.com')
  })

  it('returns "Direct" for null', () => {
    expect(formatReferrer(null)).toBe('Direct')
  })

  it('returns "Direct" for undefined', () => {
    // @ts-expect-error mock Prisma typing
    expect(formatReferrer(undefined)).toBe('Direct')
  })

  it('truncates invalid URLs to 40 chars', () => {
    const long = 'a'.repeat(50)
    expect(formatReferrer(long)).toHaveLength(40)
  })
})

// ─── formatDevice ─────────────────────────────────────────────────────────────

describe('formatDevice', () => {
  it('capitalizes known device types', () => {
    expect(formatDevice('desktop')).toBe('Desktop')
    expect(formatDevice('mobile')).toBe('Mobile')
    expect(formatDevice('tablet')).toBe('Tablet')
  })

  it('capitalizes unknown device types', () => {
    expect(formatDevice('gaming')).toBe('Gaming')
  })

  it('returns "Unknown" for null', () => {
    expect(formatDevice(null)).toBe('Unknown')
  })

  it('returns "Unknown" for empty string', () => {
    expect(formatDevice('')).toBe('Unknown')
  })
})

// ─── formatBrowser ────────────────────────────────────────────────────────────

describe('formatBrowser', () => {
  it('capitalizes browser names', () => {
    expect(formatBrowser('chrome')).toBe('Chrome')
    expect(formatBrowser('safari')).toBe('Safari')
    expect(formatBrowser('firefox')).toBe('Firefox')
  })

  it('returns "Unknown" for null', () => {
    expect(formatBrowser(null)).toBe('Unknown')
  })

  it('returns "Unknown" for empty string', () => {
    expect(formatBrowser('')).toBe('Unknown')
  })
})

// ─── fillTimeSeries ───────────────────────────────────────────────────────────

describe('fillTimeSeries', () => {
  function makeDate(daysAgo: number): Date {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - daysAgo)
    d.setUTCHours(12, 0, 0, 0)
    return d
  }

  it('fills zeroes for days with no clicks', () => {
    const range: DateRange = { from: makeDate(6), to: makeDate(0) }
    const result = fillTimeSeries([], range)
    expect(result).toHaveLength(7)
    expect(result.every((p) => p.count === 0)).toBe(true)
  })

  it('distributes clicks into the correct day buckets', () => {
    const range: DateRange = { from: makeDate(6), to: makeDate(0) }
    const raw = [
      { clickedAt: makeDate(3) },
      { clickedAt: makeDate(3) },
      { clickedAt: makeDate(0) },
    ]
    const result = fillTimeSeries(raw, range)
    expect(result).toHaveLength(7)

    const day3 = result.find((p) => p.count === 2)
    const day0 = result.find((p) => p.count === 1)
    expect(day3).toBeDefined()
    expect(day0).toBeDefined()
  })

  it('returns dates in YYYY-MM-DD format', () => {
    const range: DateRange = { from: makeDate(1), to: makeDate(0) }
    const result = fillTimeSeries([], range)
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('handles a single-day range', () => {
    const range: DateRange = { from: makeDate(0), to: makeDate(0) }
    const result = fillTimeSeries([], range)
    expect(result).toHaveLength(1)
  })

  it('handles string timestamps in raw data', () => {
    const range: DateRange = { from: makeDate(1), to: makeDate(0) }
    const raw = [{ clickedAt: makeDate(1).toISOString() }]
    const result = fillTimeSeries(raw, range)
    expect(result).toHaveLength(2)
  })
})

// ─── rangeFromDays ────────────────────────────────────────────────────────────

describe('rangeFromDays', () => {
  it('returns a range spanning the given number of days', () => {
    const range = rangeFromDays(7)
    const days = (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
    expect(days).toBeGreaterThanOrEqual(6)
    expect(days).toBeLessThanOrEqual(7)
  })

  it('sets "from" to the start of the day (UTC)', () => {
    const range = rangeFromDays(7)
    expect(range.from.getUTCHours()).toBe(0)
    expect(range.from.getUTCMinutes()).toBe(0)
    expect(range.from.getUTCSeconds()).toBe(0)
    expect(range.from.getUTCMilliseconds()).toBe(0)
  })

  it('sets "to" to the end of the day (UTC)', () => {
    const range = rangeFromDays(7)
    expect(range.to.getUTCHours()).toBe(23)
    expect(range.to.getUTCMinutes()).toBe(59)
    expect(range.to.getUTCSeconds()).toBe(59)
    expect(range.to.getUTCMilliseconds()).toBe(999)
  })
})

// ─── toRankedRows ─────────────────────────────────────────────────────────────

describe('toRankedRows', () => {
  it('sorts groups by count descending', () => {
    const groups = [
      { key: 'a', count: 3 },
      { key: 'b', count: 10 },
      { key: 'c', count: 1 },
    ]
    const result = toRankedRows(groups, (k) => k)
    expect(result[0].name).toBe('b')
    expect(result[1].name).toBe('a')
    expect(result[2].name).toBe('c')
  })

  it('computes correct percentages', () => {
    const groups = [
      { key: 'a', count: 75 },
      { key: 'b', count: 25 },
    ]
    const result = toRankedRows(groups, (k) => k)
    expect(result[0].percentage).toBeCloseTo(75)
    expect(result[1].percentage).toBeCloseTo(25)
  })

  it('uses the formatter for display names', () => {
    const groups = [{ key: 'mobile', count: 5 }]
    const result = toRankedRows(groups, (k) => k.toUpperCase())
    expect(result[0].name).toBe('MOBILE')
  })
})
