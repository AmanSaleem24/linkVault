import crypto from 'crypto'

const BASE62 = 'abcdefghijklmnopqrstuvwxyz0123456789'
const DEFAULT_LENGTH = 7
const EXTENDED_LENGTH = 8
const MAX_RETRIES = 3

/**
 * Generate a random base36 slug (lowercase).
 * Base36^7 = ~78 billion combinations — sufficient for trial scale.
 */
export function generateSlug(length = DEFAULT_LENGTH): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((byte) => BASE62[byte % BASE62.length])
    .join('')
}

/**
 * Generate a unique slug, retrying on collision.
 * After MAX_RETRIES, extends to EXTENDED_LENGTH.
 */
export async function generateUniqueSlug(
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const slug = generateSlug()
    if (!(await checkExists(slug))) return slug
  }

  // Extend to 8 chars if collisions persist
  for (let i = 0; i < MAX_RETRIES; i++) {
    const slug = generateSlug(EXTENDED_LENGTH)
    if (!(await checkExists(slug))) return slug
  }

  throw new Error('Failed to generate a unique slug after multiple retries')
}

/**
 * Encode a pagination cursor (createdAt + id) to a base64 string.
 */
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString('base64url')
}

/**
 * Decode a pagination cursor from base64.
 */
export function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const { createdAt, id } = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    return { createdAt: new Date(createdAt), id }
  } catch {
    return null
  }
}
