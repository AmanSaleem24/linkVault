/**
 * Centralized configuration — reads from environment variables with safe defaults.
 * Server-only: do not import from client components.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const AUTH_TOKEN_EXPIRY_MINUTES = parseInt(
  process.env.AUTH_TOKEN_EXPIRY_MINUTES || '30',
  10
)

export const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = parseInt(
  process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES || '15',
  10
)

export const BCRYPT_ROUNDS = parseInt(
  process.env.BCRYPT_ROUNDS || '10',
  10
)

// ─── Free Tier Limits ─────────────────────────────────────────────────────────

export const FREE_TIER_LINK_LIMIT = parseInt(
  process.env.FREE_TIER_LINK_LIMIT || '50',
  10
)

export const FREE_TIER_QR_LIMIT = parseInt(
  process.env.FREE_TIER_QR_LIMIT || '10',
  10
)

export const FREE_TIER_LIMITS = {
  links: FREE_TIER_LINK_LIMIT,
  qr: FREE_TIER_QR_LIMIT,
} as const
