export type SegmentRow = { name: string; count: number; percentage: number }
export type LocationRow = { name: string; count: number; percentage: number }
export type TimeSeriesPoint = { date: string; count: number }

export type TopLinkRow = {
  id: string
  slug: string
  originalUrl: string
  clickCount: number
  status: 'active' | 'disabled' | 'expired'
}

export type StatusBreakdownRow = { name: string; count: number; percentage: number }

export type DateRange = { from: Date; to: Date }
