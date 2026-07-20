import { z } from 'zod'

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Must be a valid email').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
})

export const loginSchema = z.object({
  email: z.string().email('Must be a valid email').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email').toLowerCase(),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ─── Settings schemas ──────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Must be a valid email').toLowerCase(),
})

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100)
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const updateDefaultsSchema = z.object({
  defaultUtmSource: z.string().max(100, 'Source too long').optional().nullable(),
  defaultUtmMedium: z.string().max(100, 'Medium too long').optional().nullable(),
  defaultUtmCampaign: z.string().max(100, 'Campaign too long').optional().nullable(),
  defaultExpiresIn: z.string().max(50, 'Invalid preset').optional().nullable(),
})

// ─── Link schemas ─────────────────────────────────────────────────────────────

export const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export const RESERVED_SLUGS = [
  'api',
  'admin',
  'dashboard',
  'login',
  'signup',
  'logout',
  'verify-email',
  'forgot-password',
  'reset-password',
  'settings',
  'profile',
  'health',
  'status',
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
] as const

export const createLinkSchema = z
  .object({
    url: z.string().url('Must be a valid URL').max(2048, 'URL is too long'),
    alias: z
      .string()
      .min(3, 'Alias must be at least 3 characters')
      .max(50, 'Alias must be at most 50 characters')
      .regex(SLUG_REGEX, 'Letters, numbers, and hyphens only (no leading/trailing hyphens)')
      .refine(
        (val) => !(RESERVED_SLUGS as readonly string[]).includes(val),
        'This alias is reserved'
      )
      .optional(),
    expiresIn: z.union([z.number().int().positive(), z.string(), z.null()]).optional().nullable(),
    qrCode: z.boolean().optional().default(false),
  })
  .transform((data) => ({
    url: data.url,
    alias: data.alias,
    expiresAt: data.expiresIn !== undefined && data.expiresIn !== null ? resolveExpiry(data.expiresIn as ExpiryDuration) : undefined,
    qrCode: data.qrCode,
  }))

export const updateLinkSchema = z
  .object({
    id: z.string().cuid(),
    url: z.string().url('Must be a valid URL').optional(),
    alias: z
      .string()
      .min(3, 'Alias must be at least 3 characters')
      .max(50, 'Alias must be at most 50 characters')
      .regex(SLUG_REGEX, 'Letters, numbers, and hyphens only (no leading/trailing hyphens)')
      .refine(
        (val) => !(RESERVED_SLUGS as readonly string[]).includes(val),
        'This alias is reserved'
      )
      .optional(),
    expiresIn: z.union([z.number().int().positive(), z.string(), z.null()]).optional().nullable(),
  })
  .transform((data) => ({
    id: data.id,
    url: data.url,
    alias: data.alias,
    expiresAt: data.expiresIn !== undefined && data.expiresIn !== null ? resolveExpiry(data.expiresIn as ExpiryDuration) : undefined,
  }))

// ─── Expiry duration helpers ─────────────────────────────────────────────────

export type ExpiryDuration = `${number}m` | `${number}h` | `${number}d` | `${number}w` | `${number}mo` | number | 'custom' | null

export type LinkStatus = 'active' | 'disabled' | 'expired'

export const PRESET_DURATIONS: { label: string; value: ExpiryDuration }[] = [
  { label: 'No expiry', value: null },
  { label: '15 minutes', value: '15m' },
  { label: '1 hour', value: '1h' },
  { label: '3 hours', value: '3h' },
  { label: '12 hours', value: '12h' },
  { label: '1 day', value: '1d' },
  { label: '3 days', value: '3d' },
  { label: '1 week', value: '1w' },
  { label: '1 month', value: '1mo' },
]

export function resolveExpiry(input: ExpiryDuration): Date | null {
  if (input === null) return null

  // Custom: plain number = minutes
  if (typeof input === 'number') {
    return new Date(Date.now() + input * 60 * 1000)
  }

  const match = input.match(/^(\d+)(m|h|d|w|mo)$/)
  if (!match) return null

  const value = Number(match[1])
  const unit = match[2]

  switch (unit) {
    case 'm':
      return new Date(Date.now() + value * 60 * 1000)
    case 'h':
      return new Date(Date.now() + value * 60 * 60 * 1000)
    case 'd':
      return new Date(Date.now() + value * 24 * 60 * 60 * 1000)
    case 'w':
      return new Date(Date.now() + value * 7 * 24 * 60 * 60 * 1000)
    case 'mo':
      return new Date(Date.now() + value * 30 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>
