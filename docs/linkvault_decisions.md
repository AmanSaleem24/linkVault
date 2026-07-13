# LinkVault — Decision Log

> Every non-trivial technical decision, documented with context, options considered, and rationale.
> Format: [ADR (Architecture Decision Record)](https://adr.github.io/) — lightweight version.

---

## ADR-001: Auth.js v5 over Better Auth

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Need auth with email/password, email verification, password reset, session cookies, and Prisma integration. Must be reliable within a 10-day trial — no time to debug edge cases in a lesser-known library. |

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Auth.js v5** | Battle-tested, massive community, Prisma adapter, built-in CSRF, extensive docs | Credentials provider is intentionally limited (no built-in email verification — must be custom) |
| **Better Auth** | Modern API, built-in email verification, cleaner DX | Newer library, smaller community, fewer real-world examples, riskier for a time-boxed project |
| **Lucia Auth** | Lightweight, full control | Deprecated as of March 2024. Maintainer recommends rolling your own. |
| **Roll your own** | Full control, no library constraints | Time sink — session management, CSRF, cookie security all become your problem |

### Decision

**Auth.js v5** with Credentials provider + Prisma adapter.

### Rationale

- The trial has zero margin for auth debugging. Auth.js's community means most edge cases are already solved on Stack Overflow and GitHub Issues.
- The Credentials provider requires custom email verification logic, but that's a known pattern (generate token → store hashed → send via Resend → verify on click). ~2 hours of work vs. unknown hours debugging a newer library.
- Built-in CSRF protection and session management remove two classes of security concerns.

### Trade-offs

- Email verification and password reset must be built manually (Auth.js Credentials doesn't include them).
- Auth.js v5 has some migration churn from v4 — must use v5-specific docs, not older tutorials.

### Reversal Cost

Medium. Auth touches every protected route. Switching mid-project would cost ~1.5 days.

---

## ADR-002: Neon Postgres over Supabase / PlanetScale

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Need a managed database that works with Vercel serverless functions. Must have a free tier sufficient for the trial. |

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Neon** | True serverless Postgres, auto-scaling, free "Always On" compute, native Vercel integration | Cold starts possible (mitigated with Always On) |
| **Supabase** | Postgres + built-in auth + storage + realtime | Too heavy — brings its own auth (conflicts with Auth.js), more opinionated than needed |
| **PlanetScale** | MySQL-compatible, great branching | MySQL not Postgres, Prisma relations limited on PlanetScale, recently removed free tier |
| **Vercel Postgres** | Zero-config on Vercel | Built on Neon anyway — using Neon directly gives more control and the same free tier |

### Decision

**Neon** with "Always On" compute enabled and connection pooling.

### Rationale

- True Postgres (not MySQL) — better ecosystem, Prisma works fully (including relations and migrations).
- "Always On" eliminates cold start latency that would break redirect targets.
- Direct Neon account gives full control over compute settings vs. Vercel Postgres's abstraction.
- Free tier includes 0.5 GB storage and 190 hours of compute — well beyond trial needs.

### Trade-offs

- Must manage the Neon project separately from Vercel (minor ops overhead).
- "Always On" uses compute hours even when idle (still within free tier limits for one project).

### Reversal Cost

Low. Database is accessed only through Prisma. Switching to another Postgres provider = change `DATABASE_URL`.

---

## ADR-003: Prisma over Drizzle / Kysely / Raw SQL

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Need an ORM/query builder that provides type safety, migrations, and integrates with Auth.js. |

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Prisma** | Auth.js adapter exists, excellent DX, generated types, migration system, widely adopted | Slightly heavier runtime, can't do every complex query |
| **Drizzle** | Lighter, closer to SQL, better performance | No official Auth.js adapter (community adapters exist but less tested) |
| **Kysely** | Type-safe query builder, lightweight | No migration system, no Auth.js adapter |
| **Raw SQL** | Full control, best performance | No type safety, manual migrations, no Auth.js adapter |

### Decision

**Prisma** with committed migrations.

### Rationale

- Auth.js's Prisma adapter is officially maintained — this is the deciding factor. Drizzle adapters exist but are community-maintained and less battle-tested.
- Prisma's generated types eliminate an entire class of bugs (wrong column names, type mismatches).
- Migration files committed to git provide a clear schema history and reproducible deployments.

### Trade-offs

- Prisma Client adds ~1MB to the serverless function bundle. Acceptable for this project.
- Some analytics aggregation queries may need `prisma.$queryRaw` for complex `GROUP BY` with date functions. These will use parameterized queries — no SQL injection risk.

### Reversal Cost

High. Prisma is deeply integrated (schema, migrations, queries, Auth.js adapter). Switching mid-project would cost ~2 days.

---

## ADR-004: Upstash Redis over Vercel KV / No Cache

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Redirect route needs to be fast (<50ms target for cache hit). Need to decide whether to add a cache layer and which service to use. |

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Upstash Redis** | Serverless-compatible (REST API), works in Edge Runtime, generous free tier (10K commands/day) | Additional service to manage, cache invalidation logic needed |
| **Vercel KV** | Zero-config on Vercel, same Upstash backend | Slightly less control, same thing with a wrapper |
| **No cache (Postgres only)** | Simpler architecture, no invalidation logic | Postgres can serve lookups in <20ms at trial scale, making cache arguably unnecessary |

### Decision

**Upstash Redis** for hot slug lookups.

### Rationale

- User decision — Redis is retained despite Postgres likely being sufficient at trial scale.
- Demonstrates caching knowledge and cache invalidation discipline to evaluators.
- Upstash's REST API works in Vercel Edge Runtime (no persistent TCP connections needed).
- The cache scope is deliberately narrow: **only slug → link data for redirects**. No session caching, no analytics caching, no multi-tier strategies.

### Trade-offs

- Cache invalidation adds code to every link mutation (create, update, delete, disable, enable).
- New failure mode: if Upstash is down, redirects fall back to Postgres (graceful degradation, not an outage).
- Slight risk of serving stale data in the 1-hour TTL window if invalidation fails.

### Reversal Cost

Low. Cache is a read-through layer. Removing it = remove Redis calls from the redirect route and mutation handlers. ~1 hour of work.

---

## ADR-005: Resend over Nodemailer / SendGrid

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Need to send transactional emails: email verification and password reset. Must be reliable and quick to integrate. |

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **Resend** | 3-line SDK, great DX, 100 emails/day free, works in Edge Runtime (HTTP API), built by ex-Vercel engineers | Newer service (less track record than SendGrid) |
| **Nodemailer + Gmail SMTP** | Free, well-known | Lands in spam frequently, requires "Less Secure Apps" or App Password, no Edge Runtime support |
| **SendGrid** | Established, 100 emails/day free | Heavier SDK, dated DX, more setup steps |
| **AWS SES** | Cheapest at scale, 62K free from EC2 | Complex IAM setup, overkill for trial |

### Decision

**Resend** as primary. Nodemailer documented as fallback (in case Resend's free tier is exhausted or account has issues).

### Rationale

- Fastest integration time — critical in a 10-day trial.
- HTTP API works everywhere (Edge, Serverless, Node.js).
- Email deliverability is better than Gmail SMTP.
- The fallback to Nodemailer is documented but unlikely to be needed (100 emails/day is ~3x the trial's expected verification volume).

### Trade-offs

- Resend is a younger service. If it has an outage, emails don't send. Mitigated by having Nodemailer as a documented fallback.

### Reversal Cost

Very low. Email sending is a single abstracted function. Swapping the transport = changing ~10 lines.

---

## ADR-006: Vercel over Netlify / VPS

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Brief requires deployment to Vercel or Netlify. |

### Decision

**Vercel**. Non-negotiable — it's the platform Next.js is built for.

### Rationale

- Next.js App Router features (Server Components, Server Actions, Edge Runtime, `opengraph-image.tsx`) are first-class on Vercel.
- Auto-deploy on push, preview URLs per PR, built-in analytics.
- Netlify's Next.js support is improving but still behind Vercel for App Router features.

### Reversal Cost

Medium. Moving to Netlify would require testing all App Router features for compatibility. Moving to VPS would require containerization (out of scope).

---

## ADR-007: shadcn/ui + Tailwind over MUI / Chakra / Vanilla CSS

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Need a UI component library that's accessible, customizable, and fast to work with. |

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| **shadcn/ui + Tailwind** | Copy-paste components (own the code), accessible (Radix primitives), highly customizable, great with Next.js | Tailwind has a learning curve if unfamiliar |
| **MUI** | Comprehensive, Material Design | Heavy bundle, opinionated design, harder to customize |
| **Chakra UI** | Good DX, accessible | Less popular for Next.js App Router, slightly heavy |
| **Vanilla CSS** | Full control, zero dependencies | Slow to build, accessibility from scratch |

### Decision

**shadcn/ui** with Tailwind CSS.

### Rationale

- You own the component code (it's copied into your project, not a node_module). This means full customization without fighting a library's API.
- Built on Radix UI primitives — keyboard navigation, focus management, and ARIA attributes come free.
- Tailwind's utility-first approach is the fastest way to style in a time-constrained project.
- shadcn/ui is the de facto standard for Next.js projects in 2024–2026.

### Reversal Cost

High. UI library touches every component. Not reversible mid-project.

---

## ADR-008: Cursor Pagination over Offset Pagination

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Dashboard link list needs pagination. Need to choose between cursor-based and offset-based. |

### Decision

**Cursor-based pagination** using `(createdAt, id)` as the cursor.

### Rationale

- Offset pagination (`SKIP N LIMIT 25`) scans and discards N rows — performance degrades linearly with page depth.
- Cursor pagination (`WHERE (createdAt, id) < (cursor_date, cursor_id) ORDER BY createdAt DESC, id DESC LIMIT 25`) uses an index seek — consistent performance regardless of page depth.
- Handles concurrent inserts gracefully: no "shifted rows" when new links are created while a user is paginating.

### Trade-offs

- No "jump to page 5" — only next/previous navigation. Acceptable for a feed-style dashboard.
- Cursor must be opaque to the client (base64-encoded `createdAt:id` string).
- Slightly more complex query logic than `OFFSET`.

### Reversal Cost

Low. Pagination is isolated to the dashboard list query and the list component. ~2 hours to switch.

---

## ADR-009: Server-Side Sessions over JWTs

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Auth.js supports both JWT and database sessions. Need to choose. |

### Decision

**Server-side sessions** stored in Postgres via Prisma adapter.

### Rationale

- JWTs cannot be revoked without maintaining a blocklist — which is functionally a session store with extra complexity.
- Server-side sessions allow immediate revocation on: password reset, role change, suspicious activity, manual logout-all.
- The "latency cost" of a DB session lookup per request is negligible — Neon responds in <10ms, and the session query hits a primary key index.

### Trade-offs

- Every authenticated request queries Postgres for the session. At trial scale, this is irrelevant. At high scale, you'd add a session cache (Redis) or switch to JWTs with short expiry + refresh tokens.

### Reversal Cost

Very low. Auth.js config change: `session: { strategy: "jwt" }`. No code changes needed.

---

## ADR-010: Base62 7-Character Slugs

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Auto-generated short codes need to be short, URL-safe, and collision-resistant. |

### Decision

7-character slugs from the base62 charset (`a-z, A-Z, 0-9`), lowercased before storage.

### Rationale

- Base62^7 = ~3.5 trillion combinations. Collision probability at trial scale (hundreds of links) is astronomically low.
- 7 characters is the sweet spot: short enough for a URL shortener, long enough for near-zero collisions.
- Lowercased for case-insensitive matching (avoids `abc` and `ABC` being different links).
- Collision handling: if the generated slug exists, retry up to 3 times, then extend to 8 characters.

### Trade-offs

- Lowercasing reduces the effective charset from 62 to 36 (base36). Base36^7 = ~78 billion — still astronomically sufficient.
- No sequential/predictable slugs — users can't enumerate links by guessing the next slug.

### Reversal Cost

Very low. Slug generation is a single utility function.

---

## ADR-011: Fire-and-Forget Click Logging

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Clicking a short link should redirect the visitor AND log the click for analytics. These two operations have conflicting latency requirements. |

### Decision

Redirect response is sent **before** the click is written to the database. Click logging is async and non-blocking.

### Rationale

- Redirect latency is user-visible and impacts trust. Analytics latency is invisible to the visitor.
- A failed click log means losing one data point. A slow redirect means losing the user.
- `waitUntil()` (Vercel) or equivalent allows running the DB write after the response is sent.

### Trade-offs

- If the click write fails (transient DB error), the click is lost forever. No retry, no queue.
- `clickCount` on the Link table may drift from actual Click table rows if writes fail.
- At production scale, this would be replaced with a queue (Redis Streams, Kafka) for guaranteed delivery.

### Reversal Cost

Low. Moving to a queue = wrap the click logging function in a queue producer instead of calling it directly.

---

## ADR-012: On-Read Aggregation over Pre-Computed Analytics

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-07-13 |
| **Context** | Analytics dashboard needs to show click breakdowns (by browser, OS, country, etc.). Need to decide between computing on read vs. pre-aggregating. |

### Decision

**Compute on read** — run `GROUP BY` queries against the Click table when the analytics page loads.

### Rationale

- At trial scale (thousands of clicks), `GROUP BY` on indexed columns returns in <50ms.
- Pre-aggregation (materialized views, rollup tables) adds schema complexity, consistency concerns (what if the rollup job fails?), and more code to maintain.
- The simplicity gain far outweighs the performance cost at this scale.

### Trade-offs

- Analytics page load time scales linearly with click count. At 100K+ clicks, query time will exceed acceptable latency.
- No historical snapshots — analytics are always computed fresh from raw data.

### Reversal Cost

Medium. Moving to pre-aggregation requires: new rollup tables, a scheduled job (Vercel Cron), migration of existing data, and updated queries. ~1 day of work.

---

## Decision Index

| ID | Decision | Reversal Cost |
|---|---|---|
| ADR-001 | Auth.js v5 for authentication | Medium |
| ADR-002 | Neon Postgres for database | Low |
| ADR-003 | Prisma for ORM | High |
| ADR-004 | Upstash Redis for caching | Low |
| ADR-005 | Resend for email | Very Low |
| ADR-006 | Vercel for hosting | Medium |
| ADR-007 | shadcn/ui + Tailwind for UI | High |
| ADR-008 | Cursor pagination | Low |
| ADR-009 | Server-side sessions | Very Low |
| ADR-010 | Base62 7-char slugs | Very Low |
| ADR-011 | Fire-and-forget click logging | Low |
| ADR-012 | On-read analytics aggregation | Medium |

> **Irreversible decisions** (High reversal cost): ORM choice (Prisma) and UI framework (shadcn/ui). These are decided early and lived with.
>
> **Easily reversible decisions** (Low/Very Low): Email provider, cache layer, slug algorithm, session strategy. These can be swapped in hours if needed.
