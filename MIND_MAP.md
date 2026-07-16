# LinkVault — Project Mind Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LinkVault — Branded URL Shortener                   │
│                   Next.js 16 | Prisma 7 | Auth.js v5 | Redis | Resend        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
    ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
    │   FRONTEND   │       │    BACKEND   │       │   EXTERNAL   │
    │  (React/TSX) │       │  (Server)    │       │  SERVICES    │
    └──────┬───────┘       └──────┬───────┘       └──────┬───────┘
           │                      │                      │
           ▼                      ▼                      ▼
┌─────────────────┐   ┌──────────────────────┐   ┌──────────────┐
│  Pages & Routes │   │  Server Actions      │   │  Neon Postgres│
│                 │   │  + API Handlers      │   │  (Prisma ORM) │
│  / (landing)    │   │                      │   └──────┬───────┘
│  /login         │──▶│  auth.ts             │◀──────┤  Upstash Redis│
│  /signup        │   │  links.ts            │◀──────┤  (Hot Cache)  │
│  /forgot-password│  │                      │◀──────┤  Resend Email │
│  /reset-password│   │  [...nextauth]       │       │  Google OAuth │
│  /verify-email  │   │    /route.ts         │       └──────────────┘
│  /auth-error    │   │                      │
│  ───────────    │   │  Middleware          │
│  (dashboard)    │   │  (auth guard + geo)  │
│  /home          │──▶│                      │
│  /link          │   │                      │
│  /link/[id]     │   │                      │
│  /link/[id]/edit│   │                      │
└─────────────────┘   └──────────────────────┘
```

---

## 1. DATA LAYER — Prisma Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         Prisma Models                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │    User     │    │    Link      │    │  AuditLog        │   │
│  │─────────────│    │──────────────│    │──────────────────│   │
│  │ id (cuid)   │◀───│ userId (FK)  │◀───│ userId (FK)      │   │
│  │ name        │    │ originalUrl  │    │ entityType       │   │
│  │ email (UQ)  │    │ slug (UQ)    │    │ entityId         │   │
│  │ passwordHash│    │ status       │    │ action           │   │
│  │ emailVerified│   │ clickCount   │    │ previousValue(JSON)│ │
│  │ image       │    │ expiresAt    │    │ newValue(JSON)   │   │
│  │ role        │    │ createdAt    │    │ createdAt        │   │
│  │ createdAt   │    │ updatedAt    │    │                  │   │
│  │ updatedAt   │    │              │    │                  │   │
│  │─────────────│    │──────────────│    │──────────────────│   │
│  │ accounts[]  │    │ clicks[]     │    │ idx: userId,     │   │
│  │ sessions[]  │    │ user (rel)   │    │   entityType     │   │
│  │ links[]     │    │              │    │ idx: entityId    │   │
│  │ auditLogs[] │    │              │    │                  │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
│         ▲                 ▲                      ▲               │
│         │                 │                      │               │
│    ┌────┴──────┐          │          ┌───────────┴───────┐       │
│    │  Account  │    ┌──────┴──────┐ │      Click        │       │
│    │───────────│    │   LinkIdx   │ │───────────────────│       │
│    │ userId    │    │─────────────│ │ id (cuid)         │       │
│    │ provider  │    │ userId,     │ │ linkId (FK)        │◀──────│
│    │ providerId│    │ status,     │ │ browser            │       │
│    │───────────│    │ createdAt   │ │ os                 │       │
│    │ UQ: prov+ │    │ idx: slug   │ │ device             │       │
│    │ providerId│    │             │ │ country            │       │
│    └───────────┘    └─────────────┘ │ referrer           │       │
│                                      │ ip                 │       │
│    ┌─────────────┐                   │ clickedAt          │       │
│    │  Session    │                   │                    │       │
│    │─────────────│                   │ idx: linkId,       │       │
│    │ userId      │                   │   clickedAt        │       │
│    │ sessionToken│                   └────────────────────┘       │
│    │ expires     │                                                    │
│    │─────────────│                                                    │
│    │ UQ: session│                                                    │
│    │   Token    │                                                    │
│    └─────────────┘                                                    │
│                                                                      │
│    ┌───────────────────────────┐                                    │
│    │  VerificationToken        │                                    │
│    │───────────────────────────│                                    │
│    │ identifier (email)        │                                    │
│    │ token (UQ)                │                                    │
│    │ expires                   │                                    │
│    │ UQ: [identifier, token]   │                                    │
│    └───────────────────────────┘                                    │
│                                                                      │
│  Enum: Role { user, pro, admin }                                     │
│  Enum: LinkStatus { active, disabled, expired }                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. ROUTING MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ROUTE TREE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  /                                    → RootLayout + Toaster (Sonner)       │
│    └── page.tsx                       → Landing page (Next.js default)      │
│                                                                             │
│  /login                               → LoginPage (public, split layout)    │
│  /signup                              → SignupPage (public, split layout)   │
│  /forgot-password                     → ForgotPasswordPage (Card layout)   │
│  /reset-password                      → ResetPasswordPage (Card + Suspense) │
│  /verify-email                        → VerifyEmailPage (Card + Suspense)   │
│  /auth-error                          → AuthErrorPage (server component)    │
│                                                                             │
│  /api/auth/[...nextauth]/route.ts     → Auth.js handler (GET+POST)         │
│                                                                             │
│  (dashboard) route group               → DashboardLayout (auth guarded)    │
│    └── layout.tsx                      → Sidebar + Topbar + main area      │
│    │                                                                        │
│    ├── /home/page.tsx                  → HomePage (create link form)       │
│    │                                                                        │
│    └── /link/                           → Link management                   │
│        ├── page.tsx                    → LinkPage (all links list)         │
│        └── [id]/                       →                                      │
│            ├── page.tsx                → Link detail + analytics           │
│            └── edit/page.tsx           → Edit link form                    │
│                                                                             │
│  MIDDLEWARE: /home*, /link* → redirect to /login if no session             │
│               /login, /signup → redirect to /home if session exists        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. AUTHENTICATION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTH FLOW (Auth.js v5)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │ Client   │───▶│ Server Actions  │───▶│ Auth.js (NextAuth)           │   │
│  │ Page     │    │ signIn/signOut  │    │                               │   │
│  │          │    │                 │    │ Providers:                    │   │
│  │          │    │ OR              │    │  1. Credentials (email+pw)    │   │
│  │          │    │                 │    │     → PrismaAdapter           │   │
│  │          │    │ Route Handler   │    │     → bcrypt compare          │   │
│  │          │    │ [...nextauth]   │    │     → custom errors           │   │
│  │          │    │                 │    │  2. Google (OAuth 2.0)        │   │
│  │          │    │                 │    │     → 30s customFetch timeout  │   │
│  └──────────┘    └────────┬────────┘    └───────────────┬───────────────┘   │
│                           │                             │                   │
│                           ▼                             ▼                   │
│                   ┌─────────────────┐         ┌───────────────────┐        │
│                   │  PrismaAdapter  │────────▶│  Database Tables  │        │
│                   │                 │         │  (Account, Session│        │
│                   │  Stores:        │         │   VerificationToken)│     │
│                   │  - Accounts     │         └───────────────────┘        │
│                   │  - Sessions     │                                      │
│                   │  - Users        │                                      │
│                   └─────────────────┘                                      │
│                                                                             │
│  JWT Strategy (session.strategy = 'jwt')                                   │
│  ├── callbacks.jwt: attaches id + role to token                            │
│  ├── callbacks.session: exposes id + role on session.user                  │
│  └── Role persisted across requests via JWT                                │
│                                                                             │
│  auth.config.ts → edge-safe config (Google provider, pages)                │
│  auth.ts → full config with providers + callbacks                          │
│                                                                             │
│  Role-based:                                                               │
│    user  → free tier (50 links, 10 QR/month)                               │
│    pro   → unlimited, QR codes, expiration, analytics                      │
│    admin → unlimited (full access)                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. SERVER ACTION FLOWS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SERVER ACTIONS (app/actions/)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          auth.ts                                      │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  signUpAction(formData)                                              │  │
│  │    ┌─────────┐   ┌────────────┐   ┌──────────┐   ┌──────────────┐   │  │
│  │    │ Validate │──▶│Check exists│──▶│$transaction│─▶│ User + VT    │   │  │
│  │    │ (Zod)    │   │  (email)   │   │  (create)  │   │ send email   │   │  │
│  │    └─────────┘   └────────────┘   └──────────┘   └──────────────┘   │  │
│  │                                                                      │  │
│  │  verifyEmailAction(token)                                             │  │
│  │    Validate → Find VT → Check expiry → $transaction (update + delete) │  │
│  │                                                                      │  │
│  │  loginAction(formData)                                                │  │
│  │    Validate → signIn('credentials') → Auth.js authorize callback     │  │
│  │                                                                      │  │
│  │  googleSignInAction() → signIn('google')                              │  │
│  │                                                                      │  │
│  │  signOutAction() → signOut()                                          │  │
│  │                                                                      │  │
│  │  forgotPasswordAction(formData)                                       │  │
│  │    Validate → Find user → Create VT → send email                     │  │
│  │                                                                      │  │
│  │  resetPasswordAction(formData)                                        │  │
│  │    Validate → Find VT → Check expiry → hash + $transaction           │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          links.ts                                     │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  createLinkAction(input)                                             │  │
│  │    Validate → Auth check → Usage limits (free tier) →                │  │
│  │    Generate slug (custom or auto) → $transaction (link + audit)      │  │
│  │    → revalidatePath('/home', '/link')                                │  │
│  │                                                                      │  │
│  │  updateLinkAction(input)                                             │  │
│  │    Validate → Auth check → Ownership check → Alias uniqueness →      │  │
│  │    $transaction (update link + audit) → invalidateCache → revalidate │  │
│  │                                                                      │  │
│  │  deleteLinkAction(id)                                                │  │
│  │    Validate → Auth check → Ownership check →                         │  │
│  │    $transaction (audit + delete) → invalidateCache → revalidate      │  │
│  │                                                                      │  │
│  │  toggleLinkStatusAction(id, newStatus)                               │  │
│  │    Validate → Auth check → Ownership check →                         │  │
│  │    $transaction (update + audit) → invalidateCache → revalidate      │  │
│  │                                                                      │  │
│  │  getUserLinksAction()                                                │  │
│  │    Auth check → prisma.link.findMany(userId, desc)                   │  │
│  │                                                                      │  │
│  │  getUserUsageStatsAction()                                           │  │
│  │    Auth check → Fetch role from DB (fresh) →                          │  │
│  │    If free: count auditLogs (links + QR this month)                  │  │
│  │    → Return { linkCount, qrCount, isPro, limits }                    │  │
│  │                                                                      │  │
│  │  invalidateCache(slug)                                               │  │
│  │    Best-effort Redis DEL (silently no-ops if Redis down)             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. MIDDLEWARE & ROUTING GUARD

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIDDLEWARE FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Every incoming request                                                    │
│        │                                                                    │
│        ▼                                                                    │
│  ┌──────────────────┐     ┌──────────────────────┐                        │
│  │ Protected routes? │────▶│ /home*, /link*       │                        │
│  │                  │     │                      │                        │
│  │                  │◀────│ No session?          │                        │
│  │                  │     │ → Redirect /login    │                        │
│  └────┬─────────────┘     └──────────────────────┘                        │
│       │                                                                    │
│       ▼                                                                    │
│  ┌──────────────────┐     ┌──────────────────────┐                        │
│  │ Auth pages?      │────▶│ /login, /signup       │                        │
│  │                  │     │                      │                        │
│  │                  │◀────│ Has session?         │                        │
│  │                  │     │ → Redirect /home     │                        │
│  └────┬─────────────┘     └──────────────────────┘                        │
│       │                                                                    │
│       ▼                                                                    │
│  ┌──────────────────┐                                                     │
│  │ Geo forwarding   │                                                     │
│  │ x-vercel-ip-     │ → forwarded as x-country header                     │
│  │ country header   │   (for click geo tracking)                          │
│  └──────────────────┘                                                     │
│                                                                             │
│  Matcher: All routes except _next/static, images, favicon, sitemap, etc.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. CACHING STRATEGY (Redis + Next.js)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CACHE ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────┐                                                     │
│  │   Upstash Redis    │                                                     │
│  │  (HTTP REST API)   │                                                     │
│  ├────────────────────┤                                                     │
│  │ Key: cache:link:${slug}                                                 │
│  │ TTL: 3600s (1 hour)                                                    │
│  │ Value: { originalUrl, status, expiresAt }                              │
│  │ Type: CachedLink                                                       │
│  └─────────┬──────────┘                                                     │
│            │                                                               │
│            │  On link create: nothing cached (fresh write)                 │
│            │  On link update/delete/toggle: invalidateCache(slug)          │
│            │  On redirect (Day 5): check cache → fallback to Postgres      │
│            │  On cache miss: hydrate from Postgres → set cache             │
│            │                                                               │
│  ┌─────────┴──────────┐                                                    │
│  │ Next.js revalidate │  revalidatePath('/home', '/link')                  │
│  │ (ISR-like)         │  Forces fresh HTML on next navigation             │
│  └────────────────────┘                                                    │
│                                                                             │
│  Future (Day 5): Redirect route handler will check Redis cache before       │
│  hitting Postgres. Cache warm-up on link creation.                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. SLUG GENERATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SLUG GENERATION PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  createLinkAction(input)                                                    │
│        │                                                                    │
│        ├── Has custom alias? ──▶ validate uniqueness ──▶ use alias         │
│        │                                                                    │
│        └── No alias ──▶ generateUniqueSlug(checkExists)                    │
│                           │                                                │
│                           ├── Loop 3x: generateSlug(7 chars)              │
│                           │        └── base62 random chars                │
│                           │        └── checkExists(slug) → DB query       │
│                           │                                             │   │
│                           ├── If all collide: Loop 3x with 8 chars       │   │
│                           │                                              │   │
│                           └── Throw if still colliding                   │   │
│                                                                             │
│  generateSlug(length=7)                                                     │
│    └── crypto.getRandomValues(Uint8Array) → base62 map → 7-char string    │
│                                                                             │
│  encodeCursor(createdAt, id) → base64url (for pagination)                  │
│  decodeCursor(base64url) → { createdAt, id } | null                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. USAGE LIMITS & BILLING GATE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FREE TIER ENFORCEMENT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  getUserUsageStatsAction()                                                  │
│    └── Always fetch fresh role from DB (no stale JWT)                       │
│    └── isPro = role === 'pro' || role === 'admin'                          │
│                                                                             │
│  FREE TIER LIMITS:                                                          │
│    Links: 50/month  (tracked via auditLog count where action='create')     │
│    QR Codes: 10/month (tracked via auditLog with hasQrCode:true in JSON)   │
│                                                                             │
│  PRO FEATURES (gated in UI + server):                                       │
│    ✓ QR Code generation                                                     │
│    ✓ Expiration dates                                                       │
│    ✓ Click analytics                                                        │
│    ✓ Custom domains (planned)                                               │
│                                                                             │
│  Enforcement points:                                                        │
│    1. createLinkAction: checks linkCount >= 50, qrCount >= 10             │
│    2. HomePage UI: disables QR toggle, expiration checkbox                 │
│    3. Dashboard: shows usage progress bars                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. AUDIT LOG SYSTEM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUDIT LOG (Every Mutation)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Every link mutation creates an AuditLog entry:                            │
│                                                                             │
│  CREATE:  action='create'   → newValue: { originalUrl, slug, ... }        │
│  UPDATE:  action='update'   → previousValue + newValue (diff)             │
│  DELETE:  action='delete'   → previousValue (full snapshot)               │
│  ENABLE:  action='enable'   → previousValue + newValue { status }          │
│  DISABLE: action='disable'  → previousValue + newValue { status }          │
│                                                                             │
│  Indexes:                                                                  │
│    - [userId, createdAt]             → user's activity timeline            │
│    - [userId, entityType, action, createdAt] → filtered audit queries      │
│    - [entityId]                      → look up by link ID                  │
│                                                                             │
│  Click data tracked separately in Click table (not AuditLog)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. COMPONENT TREE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Dashboard Layout (server) ──────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  ┌── Sidebar (client) ──────────────────────────────────────────┐    │  │
│  │  │   Logo + "Create new" button + Collapsible nav items         │    │  │
│  │  │   Nav: Home, Links, QR Codes, Analytics, Domains, Settings   │    │  │
│  │  │   (disabled items shown with "Try it" badge)                 │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  │                                                                       │  │
│  │  ┌── Header (inline in layout) ─────────────────────────────────┐    │  │
│  │  │   Logo (mobile) + Search bar (desktop) +                      │    │  │
│  │  │   Upgrade button + AccountMenu dropdown                       │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  │                                                                       │  │
│  │  ┌── Main Content Area ─────────────────────────────────────────┐    │  │
│  │  │   ┌── HomePage (client) ──────────────────────────────────┐  │    │  │
│  │  │   │  ┌── Create Link Form ──────────────────────────────┐  │  │    │  │
│  │  │   │  │  URL input + Domain display + Alias input        │  │  │    │  │
│  │  │   │  │  QR toggle + Expiration (pro) + Analytics (pro)  │  │  │    │  │
│  │  │   │  │  Usage stats bars (free tier)                     │  │  │    │  │
│  │  │   │  │  Submit button                                    │  │  │    │  │
│  │  │   │  └──────────────────────────────────────────────────┘  │  │    │  │
│  │  │   │                                                          │  │    │  │
│  │  │   │  ┌── Success State ─────────────────────────────────┐  │  │    │  │
│  │  │   │  │  Short URL + Copy button                          │  │  │    │  │
│  │  │   │  │  QR Code display (react-qr-code)                  │  │  │    │  │
│  │  │   │  │  "Create another" + "View all links" buttons     │  │  │    │  │
│  │  │   │  └──────────────────────────────────────────────────┘  │  │    │  │
│  │  │   │                                                          │  │    │  │
│  │  │   │  ┌── Live Preview Panel ─────────────────────────────┐  │  │    │  │
│  │  │   │  │  Short URL preview + QR preview                    │  │  │    │  │
│  │  │   │  │  Feature checklist                                  │  │  │    │  │
│  │  │   │  └──────────────────────────────────────────────────┘  │  │    │  │
│  │  │   └─────────────────────────────────────────────────────────┘    │  │
│  │  │                                                                  │    │  │
│  │  │  ┌── LinkPage (client) ──────────────────────────────────┐     │    │  │
│  │  │  │  "All Links" heading + placeholder text               │     │    │  │
│  │  │  │  (to be implemented Day 6)                             │     │    │  │
│  │  │  └───────────────────────────────────────────────────────┘     │    │  │
│  │  │                                                                  │    │  │
│  │  │  ┌── Link Detail Page (Day 5+) ──────────────────────────┐     │    │  │
│  │  │  │  Link info + analytics charts                          │     │    │  │
│  │  │  └───────────────────────────────────────────────────────┘     │    │  │
│  │  │                                                                  │    │  │
│  │  │  ┌── Link Edit Page (Day 5+) ────────────────────────────┐     │    │  │
│  │  │  │  Edit form pre-filled with link data                   │     │    │  │
│  │  │  └───────────────────────────────────────────────────────┘     │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Public Pages (no sidebar) ─────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  LoginPage / SignupPage                                               │   │
│  │    ┌── Split layout: form (60%) + image (40%)                        │   │
│  │    └── Google OAuth button + credentials form                        │   │
│  │                                                                       │   │
│  │  ForgotPasswordPage / ResetPasswordPage                               │   │
│  │    ┌── Centered Card layout                                           │   │
│  │    └── Brand gradient background                                      │   │
│  │                                                                       │   │
│  │  VerifyEmailPage                                                      │   │
│  │    ┌── Suspense wrapper + loading state                               │   │
│  │    └── VerifyEmailContent (calls verifyEmailAction)                   │   │
│  │                                                                       │   │
│  │  AuthErrorPage (server component)                                     │   │
│  │    ┌── Reads searchParams.error                                      │   │
│  │    └── Maps error code → human message                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─ shadcn/ui Components ───────────────────────────────────────────────┐   │
│  │  Button (base-ui primitive + CVA variants)                            │   │
│  │  Card (Card, CardHeader, CardTitle, CardContent, CardFooter)           │   │
│  │  Input (base-ui InputPrimitive)                                        │   │
│  │  Label (native label with styling)                                     │   │
│  │  Dialog (base-ui Dialog with Portal, Overlay, Content)                 │   │
│  │  DropdownMenu (base-ui Menu with Positioner, Submenu)                  │   │
│  │  Sonner/Toaster (theme-aware toast notifications)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. DATA FLOW DIAGRAMS

### A. Create Link Flow

```
User fills form → Click "Create Short Link"
        │
        ▼
HomePage.handleCreate()
  ├── Client-side URL validation
  ├── useTransition → startTransition
  └── createLinkAction({ url, alias, qrCode, expiresAt })
            │
            ▼
      Server Action
        ├── Zod safeParse validation
        ├── auth() → get session.user.id
        ├── getUserUsageStatsAction() → check free tier limits
        │     └── Prisma: count auditLog WHERE userId + entityType='link' + action='create'
        ├── If custom alias: check slug uniqueness
        └── If auto: generateUniqueSlug(checkExists)
                  └── generateSlug() → base62 random
                        └── prisma.link.findUnique({ slug }) loop
        │
        ▼
      prisma.$transaction(async tx => {
        ├── tx.link.create({ userId, originalUrl, slug, expiresAt })
        └── tx.auditLog.create({ userId, entityType:'link', action:'create', newValue })
      })
        │
        ▼
      revalidatePath('/home') + revalidatePath('/link')
        │
        ▼
    Return { success: true, data: link }
        │
        ▼
    Client: toast.success() + show success state with short URL + QR
```

### B. Auth Flow (Credentials)

```
User submits login form → handleSubmit(e)
        │
        ▼
loginAction({ email, password })
        │
        ▼
signIn('credentials', { email, password, redirectTo: '/home' })
        │
        ▼
Auth.js → Credentials provider → authorize(credentials)
        │
        ├── loginSchema.safeParse(credentials)
        ├── prisma.user.findUnique({ email })
        ├── bcrypt.compare(password, user.passwordHash)
        ├── Check emailVerified
        └── Return { id, name, email, image, role }
                │
                ▼
        JWT callback: token.id = user.id, token.role = user.role
                │
                ▼
        Session callback: session.user.id + session.user.role
                │
                ▼
        Redirect to /home
```

### C. Auth Flow (Google OAuth)

```
User clicks "Continue with Google"
        │
        ▼
googleSignInAction() → signIn('google', { redirectTo: '/home' })
        │
        ▼
Google OAuth flow (redirect → consent → callback)
        │
        ▼
PrismaAdapter handles account creation/linking
        │
        ▼
JWT + Session callbacks same as credentials flow
```

### D. Forgot/Reset Password Flow

```
User enters email → forgotPasswordAction({ email })
        │
        ├── Find user by email (silent if not found — returns success)
        ├── Generate token (32 random bytes hex)
        ├── Delete old tokens for email
        ├── Create new VerificationToken (15min expiry)
        └── sendPasswordResetEmail({ to, name, token })
                │
                ▼
        User clicks email link → /reset-password?token=xxx
                │
                ▼
        resetPasswordAction({ token, password, confirmPassword })
                │
                ├── Find VerificationToken
                ├── Check expiry
                ├── bcrypt.hash(password, 10)
                └── prisma.$transaction([
                        user.update({ passwordHash }),
                        verificationToken.delete()
                      ])
```

---

## 12. TECHNICAL ARCHITECTURE NOTES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KEY ARCHITECTURAL DECISIONS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Next.js 16 App Router with Route Groups                                 │
│     - (dashboard) group wraps authenticated pages without URL segment       │
│     - Server Components by default, 'use client' only where needed          │
│                                                                             │
│  2. Auth.js v5 + PrismaAdapter                                              │
│     - JWT strategy (not database sessions) for stateless scaling            │
│     - Custom CredentialsSignin subclasses for granular error handling       │
│     - Google provider with 30s customFetch timeout                          │
│                                                                             │
│  3. Prisma 7 with @prisma/adapter-pg                                        │
│     - Direct pg Pool → PrismaPg adapter (not default connection)            │
│     - Singleton pattern with globalThis for dev hot reload                  │
│     - Query logging in dev mode                                             │
│                                                                             │
│  4. Redis (Upstash) — Planned Hot Cache                                     │
│     - Cache key: cache:link:${slug}                                         │
│     - TTL: 1 hour                                                           │
│     - Cache invalidation on every link mutation                              │
│     - Not yet wired to redirect handler (Day 5 task)                        │
│                                                                             │
│  5. Validation: Zod v4                                                       │
│     - Shared schemas between client and server                              │
│     - safeParse in server actions, inline validation in client pages        │
│     - Reserved slugs, slug regex enforced at schema level                   │
│                                                                             │
│  6. UI: base-ui primitives + shadcn/ui                                      │
│     - base-ui (from shadcn v4) replaces Radix as primitive layer            │
│     - Button uses class-variance-authority for variants                     │
│     - Sonner for toast notifications, theme-aware                           │
│     - Tailwind v4 with CSS variables for theming                            │
│                                                                             │
│  7. Styling                                                                 │
│     - Tailwind v4 with @theme inline for custom properties                  │
│     - Brand palette: purple/blue (#3D52A0) + orange (#FF6C37) accents      │
│     - Dark mode via .dark class + next-themes                               │
│     - Geist font in dashboard, Inter in auth pages                          │
│                                                                             │
│  8. Middleware Strategy                                                      │
│     - Auth guard protects dashboard routes                                  │
│     - Auth'd users redirected away from login/signup                        │
│     - Geo header forwarding (x-vercel-ip-country → x-country)               │
│                                                                             │
│  9. Testing: Vitest 4                                                        │
│     - Unit tests: slugs, validators, usage limits                           │
│     - Integration tests: full auth flow against Neon                        │
│     - Email sending mocked in tests                                         │
│                                                                             │
│  10. 10-Day Plan                                                             │
│      Day 1:  Setup + deploy                                                  │
│      Day 2:  Schema + auth backend  ✅                                      │
│      Day 3:  Auth UI + access control ✅                                     │
│      Day 4:  Core URL shortening (form + server action) 🔄                  │
│      Day 5:  Redirect service + Redis cache ⬜                              │
│      Day 6:  Dashboard (search/filter/sort/pagination) ⬜                   │
│      Day 7:  Analytics ⬜                                                   │
│      Day 8:  CSV export, Cmd+K, audit log ⬜                                │
│      Day 9:  SEO + polish ⬜                                                │
│      Day 10: Harden + ship ⬜                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. ENVIRONMENT VARIABLES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         .env CONFIGURATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DATABASE_URL      → Neon Postgres (pooled via pgbouncer)                  │
│  DIRECT_URL        → Neon Postgres (direct, for migrations)                │
│  AUTH_SECRET       → Auth.js JWT signing secret (32+ bytes)               │
│  NEXTAUTH_URL      → App base URL (http://localhost:3000 in dev)           │
│  AUTH_GOOGLE_ID    → Google OAuth Client ID                                │
│  AUTH_GOOGLE_SECRET → Google OAuth Client Secret                           │
│  UPSTASH_REDIS_REST_URL → Upstash Redis endpoint                           │
│  UPSTASH_REDIS_REST_TOKEN → Upstash Redis auth token                       │
│  RESEND_API_KEY    → Resend email service API key                          │
│  RESEND_FROM_EMAIL → Sender email address                                   │
│  NEXT_PUBLIC_APP_URL → Public app URL (for email links)                    │
│  NEXT_PUBLIC_BASE_URL → Short link domain (e.g. linkvault.com)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. FILE INVENTORY (Actual vs Planned)

```
src/
├── app/
│   ├── actions/
│   │   ├── auth.ts              ✅ signUp, verifyEmail, login, googleSignIn,
│   │   │                          signOut, forgotPassword, resetPassword
│   │   └── links.ts             ✅ create, update, delete, toggle, getLinks,
│   │                              getUserUsageStats + invalidateCache
│   ├── api/auth/[...nextauth]/route.ts  ✅ GET + POST handler
│   ├── auth-error/page.tsx      ✅ Error code → message mapping
│   ├── (dashboard)/
│   │   ├── layout.tsx           ✅ Auth guard, sidebar, topbar
│   │   ├── home/page.tsx        ✅ Full create-link form + preview
│   │   └── link/
│   │       ├── page.tsx         ⚠️  Placeholder (needs Day 6 implementation)
│   │       └── [id]/
│   │           ├── page.tsx     ❌ Not created yet (Day 5-7)
│   │           └── edit/page.tsx ❌ Not created yet (Day 5)
│   ├── login/page.tsx           ✅ Split layout + Google + credentials
│   ├── signup/page.tsx          ✅ Split layout + Google + credentials
│   ├── forgot-password/page.tsx ✅ Email input → token generation
│   ├── reset-password/page.tsx  ✅ Token validation + new password
│   ├── verify-email/page.tsx    ✅ Token → email verification
│   ├── layout.tsx               ✅ Root (Inter + JetBrains Mono fonts)
│   ├── globals.css              ✅ Tailwind v4 + brand palette + dark mode
│   └── page.tsx                 ⚠️  Default Next.js landing (to be replaced)
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx          ✅ Collapsible nav + "Create new" button
│   │   └── account-menu.tsx     ✅ Avatar dropdown (Upgrade + Sign out)
│   └── ui/
│       ├── button.tsx           ✅ base-ui primitive + CVA variants
│       ├── card.tsx             ✅ Card, Header, Title, Content, Footer
│       ├── dialog.tsx           ✅ base-ui Dialog with Portal/Overlay
│       ├── dropdown-menu.tsx    ✅ base-ui Menu with Positioner/Submenu
│       ├── input.tsx            ✅ base-ui InputPrimitive
│       ├── label.tsx            ✅ Native label wrapper
│       └── sonner.tsx            ✅ Theme-aware toast notifications
├── lib/
│   ├── auth.ts                  ✅ NextAuth full config (Providers + callbacks)
│   ├── auth.config.ts           ✅ Edge-safe config (Google + pages)
│   ├── prisma.ts                ✅ PrismaClient singleton (pg adapter)
│   ├── redis.ts                 ✅ Upstash Redis client + key helpers
│   ├── email.ts                 ✅ Resend email sender (verification + reset)
│   ├── slugs.ts                 ✅ generateSlug, generateUniqueSlug, cursors
│   ├── utils.ts                 ✅ cn() helper (clsx + tailwind-merge)
│   └── validators/index.ts      ✅ All Zod schemas (auth + link)
├── types/
│   └── next-auth.d.ts           ✅ Session + User type extensions
└── middleware.ts                ✅ Auth guard + geo header forwarding
```

---

## 15. DEPENDENCIES MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY RELATIONSHIPS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Framework Layer:                                                           │
│    next 16.2.10 ─── react 19.2.4, react-dom 19.2.4                         │
│    next/font/google ─── Inter, JetBrains Mono                               │
│                                                                             │
│  Auth Layer:                                                                │
│    next-auth@5.0.0-beta.31 ─── @auth/prisma-adapter 2.11.2                 │
│                              ─── next-auth/providers (Google, Credentials)  │
│    bcryptjs 3.0.3 ─── password hashing in authorize callback               │
│                                                                             │
│  Database Layer:                                                            │
│    @prisma/client 7.8.0 ─── @prisma/adapter-pg 7.8.0 ─── pg 8.22.0        │
│    prisma 7.8.0 (CLI)                                                       │
│                                                                             │
│  Cache Layer:                                                               │
│    @upstash/redis 1.38.0                                                    │
│                                                                             │
│  Email Layer:                                                               │
│    resend 6.17.2                                                            │
│                                                                             │
│  UI Layer:                                                                  │
│    @base-ui/react 1.6.0 ─── Button, Dialog, Menu, Input primitives          │
│    class-variance-authority 0.7.1 ─── Button variant system                 │
│    clsx 2.1.1 + tailwind-merge 3.6.0 ─── cn() utility                      │
│    lucide-react 1.24.0 ─── icons                                            │
│    sonner 2.0.7 ─── toast notifications                                     │
│    next-themes 0.4.6 ─── dark mode toggle                                   │
│    react-qr-code 2.0.0 ─── QR code generation                               │
│    ua-parser-js 2.0.10 ─── browser/OS/device parsing (for analytics)        │
│                                                                             │
│  Styling Layer:                                                             │
│    tailwindcss 4 ─── @tailwindcss/postcss 4                                 │
│    tw-animate-css 1.4.0 ─── animation utilities                             │
│                                                                             │
│  Validation:                                                                │
│    zod 4.4.3 ─── shared schemas for client + server                        │
│                                                                             │
│  Testing:                                                                   │
│    vitest 4.1.10 ─── @vitejs/plugin-react 6.0.3                           │
│                   ─── @vitest/ui 4.1.10                                    │
│    dotenv 17.4.2 ─── env loading in tests                                   │
│                                                                             │
│  Dev:                                                                       │
│    @types/* packages for TypeScript strict mode                             │
│    eslint 9 + eslint-config-next                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. NOTABLE PATTERNS & CONVENTIONS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CODE PATTERNS                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Server Action Pattern (strict):                                        │
│     'use server'                                                           │
│     → Zod safeParse → { success, error } on failure                       │
│     → auth() for protected actions                                        │
│     → Row-level ownership check (resource.userId === session.user.id)      │
│     → $transaction for multi-step DB operations                           │
│     → Return { success: true, data? } or { success: false, error }        │
│     → revalidatePath() for cache invalidation                             │
│                                                                             │
│  2. Redis Cache Best-Effort:                                               │
│     async function invalidateCache(slug) {                                 │
│       try { await redis.del(LINK_CACHE_KEY(slug)) }                       │
│       catch { /* silently no-ops */ }                                      │
│     }                                                                      │
│     Prevents cascading failures if Redis is down                           │
│                                                                             │
│  3. Custom Auth Errors:                                                    │
│     class OAuthAccountNotLinkedError extends CredentialsSignin            │
│     class EmailNotVerifiedError extends CredentialsSignin                 │
│     → Maps to specific error.type in loginAction catch block              │
│                                                                             │
│  4. Fresh Role from DB:                                                    │
│     Usage stats always re-read role from Postgres                          │
│     → Prevents stale role after billing upgrade without re-login           │
│                                                                             │
│  5. Audit-First Delete:                                                    │
│     Audit log created BEFORE the delete in transaction                     │
│     → Audit references userId (not linkId), survives cascade delete       │
│                                                                             │
│  6. Dual Email Link + Dev Fallback:                                        │
│     try { await sendEmail() }                                              │
│     catch { if dev → console.log link }                                    │
│     → Never breaks signup flow if email service fails                      │
│                                                                             │
│  7. Suspense + useSearchParams Pattern:                                    │
│     Page wraps content in <Suspense>                                       │
│     Inner component uses useSearchParams (client-only)                     │
│     → Avoids SSR/CSR mismatch for query params                            │
│                                                                             │
│  8. Type Safety:                                                           │
│     strict: true in tsconfig                                               │
│     no-explicit-any enforced                                                │
│     Session type extended in next-auth.d.ts                                │
│     Zod inference for input types (CreateLinkInput, etc.)                 │
│                                                                             │
│  9. Index Strategy:                                                        │
│     Link: [userId, status, createdAt] — user's link list queries           │
│     Link: [slug] — unique slug lookups (also UQ constraint)               │
│     Click: [linkId, clickedAt] — analytics per link, time-ordered         │
│     AuditLog: [userId, createdAt] — user activity timeline                │
│     AuditLog: [userId, entityType, action, createdAt] — filtered audits    │
│     AuditLog: [entityId] — look up all events for a link                   │
│                                                                             │
│ 10. Cascade Delete:                                                        │
│     Link.onDelete: Cascade → Click rows deleted with link                  │
│     AuditLog.onDelete: Cascade → audit entries cleaned up                 │
│     AuditLog created before delete → uses userId, survives link deletion  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 17. DAY 4 STATUS SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DAY 4 — CORE URL SHORTENING (In Progress)               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ DONE:                                                                  │
│     ✓ Server actions (create, update, delete, toggle links)                │
│     ✓ Home page with full create-link form                                 │
│     ✓ Live preview panel (short URL + QR)                                  │
│     ✓ Usage limits enforcement (free tier: 50 links, 10 QR)               │
│     ✓ Custom alias with uniqueness validation                              │
│     ✓ Auto-slug generation with collision retry                            │
│     ✓ Audit log creation on every mutation                                 │
│     ✓ Redis cache invalidation hooks (best-effort)                         │
│     ✓ revalidatePath on dashboard after mutations                          │
│     ✓ QR code generation via react-qr-code                                 │
│     ✓ Usage stats progress bars (free tier UI)                             │
│     ✓ Pro/Expiration/Analytics gating in UI                                │
│                                                                             │
│  🔄 IN PROGRESS / TODO:                                                    │
│     - Link page (/link) is placeholder — needs list + CRUD (Day 6)        │
│     - Link detail page (/link/[id]) — not created (Day 5-7)              │
│     - Link edit page (/link/[id]/edit) — not created (Day 5)             │
│     - Redirect handler (/[slug] → 301) — not created (Day 5)             │
│     - Redis cache warm-up on redirect — not wired (Day 5)                │
│     - Click tracking (UA parsing, geo) — not implemented (Day 5-7)       │
│     - Landing page (/page.tsx) still has default Next.js content          │
│     - Search/filter/sort/pagination (Day 6)                               │
│     - Analytics dashboard (Day 7)                                          │
│                                                                             │
│  ⚠️  TEST FILES (untracked, likely scratch):                               │
│     - test-audit.ts, test-audit2.ts, test-db-user.ts, test-prisma.ts      │
│     - tests/unit/usage-limits.test.ts (new, has actual tests)             │
│     - tests/integration/auth.test.ts (has actual tests)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Generated by exploring the full codebase on 2026-07-16*
