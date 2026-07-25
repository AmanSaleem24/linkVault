/**
 * Theme-aware chart color palette.
 *
 * Both palettes use the same hues — only lightness increases in dark mode
 * so the colors remain legible against dark surfaces without hue drift.
 */

export const CHART_COLORS_LIGHT = [
  '#3D52A0', // brand blue
  '#06b6d4', // cyan
  '#f97316', // orange
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#10b981', // green
] as const

export const CHART_COLORS_DARK = [
  '#7091E6', // brand blue (same hue, +24% lightness)
  '#22d3ee', // cyan
  '#fb923c', // orange
  '#a78bfa', // violet
  '#f472b6', // pink
  '#34d399', // green
] as const

export const STATUS_COLORS_LIGHT = ['#10b981', '#94a3b8', '#ef4444'] as const
export const STATUS_COLORS_DARK  = ['#34d399', '#94a3b8', '#f87171'] as const

export type ChartColorSet = typeof CHART_COLORS_LIGHT | typeof CHART_COLORS_DARK
