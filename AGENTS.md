<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Rules

## Git Workflow
- Do not run `git commit`, `git add`, or any other Git commands automatically without first asking the user for explicit permission.

---

# LinkVault — Project Context

> Branded URL shortener with analytics, custom slugs, and role-aware access.
> Built with Next.js 16, TypeScript strict, Tailwind v4, shadcn/ui, Prisma 7 (Neon Postgres), Auth.js v5, Upstash Redis, Resend email.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, `src/` directory) |
| Language | TypeScript (strict, `no-explicit-any`) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-ui primitives) |
| Fonts | Inter (sans), JetBrains Mono (mono) — via `next/font/google` |
| Auth | Auth.js v5 (`next-auth@5.0.0-beta.31`) — Credentials + Google providers, Prisma adapter, JWT sessions |
| Database | Neon Postgres via Prisma 7 (`@prisma/adapter-pg` + `pg` pool) |
| Cache | Upstash Redis (`@upstash/redis`) — hot slug lookups, 1hr TTL |
| Email | Resend (verification + password reset) |
| Validation | Zod v4 — shared schemas for client + server |
| Testing | Vitest 4 (`pnpm test`) |
| Package Manager | pnpm 10 |

## Project Structure

```
src/
├── app/
│   ├── actions/
│   │   ├── auth.ts              # Server actions: signup, login, verify-email, forgot/reset password
│   │   └── links.ts             # Server actions: create, update, delete, toggle, list links
│   ├── api/auth/[...nextauth]/   # Auth.js route handler
│   ├── (dashboard)/              # Route group — no URL segment, shared layout with sidebar
│   │   ├── layout.tsx            # Auth guard + persistent sidebar (Home, All Links, Analytics, Settings, Logout)
│   │   ├── home/page.tsx         # Dashboard overview (/home)
│   │   └── link/
│   │       ├── page.tsx          # All links list (/link)
│   │       └── [id]/
│   │           ├── page.tsx      # Link detail + analytics (/link/[id])
│   │           └── edit/page.tsx # Edit link (/link/[id]/edit)
│   ├── login/page.tsx            # Split layout: form left, image right
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── verify-email/page.tsx
│   ├── layout.tsx                # Root layout (Inter + JetBrains Mono fonts)
│   ├── globals.css               # Tailwind v4 config + brand palette + dark mode
│   └── page.tsx                  # Landing page
├── components/
│   └── ui/                       # shadcn components (button, card, input, label)
├── lib/
│   ├── auth.ts                   # NextAuth config (Credentials + Google, JWT callbacks)
│   ├── auth.config.ts            # Edge-safe auth config (Google provider, pages)
│   ├── prisma.ts                 # PrismaClient singleton (pg adapter, dev query logging)
│   ├── redis.ts                  # Upstash Redis client + cache key helpers
│   ├── email.ts                  # Resend email transport
│   ├── slugs.ts                  # generateSlug, generateUniqueSlug, encodeCursor, decodeCursor
│   ├── utils.ts                  # cn() helper (clsx + tailwind-merge)
│   └── validators/index.ts       # Zod schemas (auth + link)
├── middleware.ts                 # Auth guard + geo header forwarding
tests/
├── unit/
│   └── slugs-and-validators.test.ts
```

## Prisma Schema (Key Models)

```
User       — id, name, email (unique), passwordHash, role (user|admin), emailVerified
Link       — id, userId (FK), originalUrl, slug (unique), status (active|disabled|expired), clickCount, expiresAt
Click      — id, linkId (FK), browser, os, device, country, referrer, ip, clickedAt
AuditLog   — id, userId (FK), entityType, entityId, action, previousValue (JSON), newValue (JSON), createdAt
Account    — Auth.js OAuth accounts
Session    — Auth.js sessions
VerificationToken — email verification + password reset tokens
```

## Brand Palette (CSS Variables)

```
--color-brand-50:  #EDE8F5    --color-brand-400: #3D52A0 (primary)
--color-brand-100: #ADBBDA    --color-brand-500: #2E3F80
--color-brand-200: #8697C4    --color-brand-600: #1F2C5C
--color-brand-300: #7091E6    --color-brand:     #3D52A0
```

Light mode primary: `brand-400`, Dark mode primary: `brand-300`.

## Code Conventions

### Server Actions Pattern
All server actions follow this structure (see `src/app/actions/auth.ts`):
1. `'use server'` directive
2. Validate input with Zod `.safeParse()` → return `{ success: false, error }` on failure
3. Authenticate via `auth()` from `@/lib/auth` (for protected actions)
4. Enforce row-level ownership: `resource.userId === session.user.id`
5. Perform DB operation (use `$transaction` for multi-step)
6. Return `{ success: true, data? }` or `{ success: false, error }`
7. Call `revalidatePath()` for cache invalidation where applicable

### Auth Session Access
```typescript
import { auth } from '@/lib/auth'
const session = await auth()
// session.user.id, session.user.email, session.user.role
```
Role is stored on JWT token via custom callback. Session type is extended with `id` and `role`.

### Validation Schemas
All in `src/lib/validators/index.ts`. Shared between client and server:
- `signupSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- `createLinkSchema` — url (required), alias (optional, 3-50 chars, lowercase alphanumeric + hyphens, no reserved words), expiresAt (optional)
- `updateLinkSchema` — id (cuid), url (optional), alias (optional), expiresAt (optional)
- `RESERVED_SLUGS` — api, admin, dashboard, login, signup, logout, verify-email, forgot-password, reset-password, settings, profile, health, status, sitemap.xml, robots.txt, favicon.ico
- `SLUG_REGEX` — `/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/`

### Redis Cache Keys
```typescript
import { redis, LINK_CACHE_KEY, LINK_CACHE_TTL } from '@/lib/redis'
// LINK_CACHE_KEY(slug) → `cache:link:${slug}` (TTL: 1 hour)
// CachedLink type: { originalUrl, status, expiresAt }
```

### Slug Generation
- `generateSlug(length?)` — base36, 7 chars default, lowercase
- `generateUniqueSlug(checkExists)` — retries 3x at 7 chars, then 3x at 8 chars
- `encodeCursor` / `decodeCursor` — base64url pagination cursors

### Middleware
- Protects `/home*` and `/link*` routes (redirects to `/login`)
- Redirects authenticated users away from `/login`, `/signup` → sends to `/home`
- Forwards `x-vercel-ip-country` as `x-country` header for click geo

### UI Components
shadcn/ui with base-ui primitives. Available: `button`, `card`, `input`, `label`.
Button has variants: default, outline, secondary, ghost, destructive, link.
Uses `class-variance-authority` for variant styling.

### Auth Pages UI Pattern
Login/signup use a split layout: form on left (60%), full-bleed image on right (40%, hidden on mobile).
Form styling: white background, subtle box shadows, brand-colored CTAs, inline field validation errors.

## 10-Day Plan Progress

| Day | Focus | Status |
|---|---|---|
| 1 | Setup + hello-world deploy | ✅ Done |
| 2 | Schema + auth backend | ✅ Done |
| 3 | Auth UI + access control | ✅ Done |
| 4 | Core URL shortening | 🔄 Current |
| 5 | Redirect service + cache | ⬜ Next |
| 6 | Dashboard (search/filter/sort/pagination) | ⬜ |
| 7 | Analytics | ⬜ |
| 8 | Beyond-basics (CSV, Cmd+K, audit log) | ⬜ |
| 9 | SEO + polish | ⬜ |
| 10 | Harden + ship | ⬜ |
