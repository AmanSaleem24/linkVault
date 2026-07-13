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

export const createLinkSchema = z.object({
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
  expiresAt: z.coerce
    .date()
    .min(new Date(), 'Expiry must be in the future')
    .optional()
    .nullable(),
})

export const updateLinkSchema = z.object({
  id: z.string().cuid(),
  url: z.string().url('Must be a valid URL').max(2048).optional(),
  alias: z
    .string()
    .min(3)
    .max(50)
    .regex(SLUG_REGEX, 'Letters, numbers, and hyphens only')
    .optional(),
  expiresAt: z.coerce.date().min(new Date()).optional().nullable(),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>
