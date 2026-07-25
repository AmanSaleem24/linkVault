'use client'

import { useTheme } from 'next-themes'
import {
  CHART_COLORS_LIGHT,
  CHART_COLORS_DARK,
  STATUS_COLORS_LIGHT,
  STATUS_COLORS_DARK,
} from '@/lib/chart-colors'

/**
 * Returns the correct chart and status color arrays for the current theme.
 * Falls back to light-mode colors during SSR/before mount.
 */
export function useChartColors() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return {
    segmentColors: isDark ? [...CHART_COLORS_DARK] : [...CHART_COLORS_LIGHT],
    statusColors: isDark ? [...STATUS_COLORS_DARK] : [...STATUS_COLORS_LIGHT],
  }
}
