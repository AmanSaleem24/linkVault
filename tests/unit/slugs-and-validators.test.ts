import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/slugs'
import { createLinkSchema, loginSchema, signupSchema } from '@/lib/validators'

describe('generateSlug', () => {
  it('generates a 7-character slug by default', () => {
    const slug = generateSlug()
    expect(slug).toHaveLength(7)
  })

  it('only contains lowercase alphanumeric characters', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSlug()).toMatch(/^[a-z0-9]+$/)
    }
  })

  it('generates unique slugs', () => {
    const slugs = new Set(Array.from({ length: 1000 }, () => generateSlug()))
    // With 78B combinations, 1000 unique is a certainty
    expect(slugs.size).toBe(1000)
  })
})

describe('createLinkSchema', () => {
  it('accepts a valid URL', () => {
    expect(createLinkSchema.safeParse({ url: 'https://example.com' }).success).toBe(true)
  })

  it('rejects an invalid URL', () => {
    expect(createLinkSchema.safeParse({ url: 'not-a-url' }).success).toBe(false)
  })

  it('rejects a reserved alias', () => {
    expect(createLinkSchema.safeParse({ url: 'https://x.com', alias: 'admin' }).success).toBe(false)
  })

  it('accepts a valid custom alias', () => {
    expect(createLinkSchema.safeParse({ url: 'https://x.com', alias: 'my-link' }).success).toBe(true)
  })

  it('rejects an alias with leading hyphens', () => {
    expect(createLinkSchema.safeParse({ url: 'https://x.com', alias: '-bad' }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-email', password: 'secret' }).success).toBe(false)
  })
})

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    expect(
      signupSchema.safeParse({
        name: 'Alice',
        email: 'Alice@Example.COM',
        password: 'Password1',
      }).success
    ).toBe(true)
  })

  it('lowercases the email', () => {
    const result = signupSchema.safeParse({
      name: 'Alice',
      email: 'Alice@Example.COM',
      password: 'Password1',
    })
    if (result.success) {
      expect(result.data.email).toBe('alice@example.com')
    }
  })

  it('rejects a weak password', () => {
    expect(
      signupSchema.safeParse({ name: 'Alice', email: 'a@b.com', password: 'weak' }).success
    ).toBe(false)
  })
})
