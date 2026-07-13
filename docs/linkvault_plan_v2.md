# LinkVault — PLAN v2

> **A branded link shortener with analytics, custom slugs, and role-aware access — built and shipped in 10 days for the Digital Heroes Full Stack Developer Trial.**

---

## Changes from v1

| Change | Rationale |
|---|---|
| **Auth.js (v5)** replaces Better Auth | Battle-tested, extensive docs, Prisma adapter, broad community support |
| **Resend** added as email transport (Nodemailer as fallback) | Resend has superior DX and deliverability for transactional email on Vercel; Nodemailer kept as documented fallback if Resend's free tier is insufficient |
| **Redis (Upstash) retained** | User decision — kept for hot URL lookups despite Postgres likely being fast enough at trial scale |
| **Bulk actions cut from Day 8** → moved to Bonus | Day 8 was overloaded (4 features); now 3 features with breathing room |
| **Unit tests distributed across days** | Tests written alongside features, not batched on Day 10 |

---

## Project Information

| Property              | Value                                                        |
| ---------------------- | ------------------------------------------------------------ |
| **Project Name**       | LinkVault                                                     |
| **Project Type**       | Full-Stack Web App (Trial Submission)                         |
| **Timebox**            | 10 days (within the 7–14 day window)                          |
| **Primary Language**   | TypeScript (strict, no `any`)                                 |
| **License**            | MIT                                                            |
| **Repository**         | Public                                                         |
| **Documentation**      | README.md, PLAN.md, docs/architecture.md, CONTRIBUTING.md, CHANGELOG.md |
| **Deployment**         | Vercel (frontend + serverless) + Neon Postgres                |

---

## Table of Contents

1. [Vision](#vision)
2. [Timeline (Day-by-Day)](#timeline-day-by-day)
3. [Scope](#scope)
4. [Tech Stack](#tech-stack)
5. [Functional Requirements](#functional-requirements)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [Repository Structure](#repository-structure)
8. [Documentation Plan](#documentation-plan)
9. [Deployment Plan](#deployment-plan)
10. [Submission Checklist](#submission-checklist)
11. [Risks & Mitigation](#risks--mitigation)
12. [Post-Trial Roadmap](#post-trial-roadmap)

---

## Vision

LinkVault is a production-quality URL shortener: create short links, attach custom aliases, track clicks, and manage everything from a fast dashboard.

The build is judged on the Digital Heroes rubric — product quality, UX craft, code quality, deployment reliability, docs, GitHub hygiene, SEO, and attention to detail — not on backend complexity for its own sake. Every decision below is scoped against that rubric, not against "what's the most advanced version of this system."

---

## Timeline (Day-by-Day)

10-day plan, leaving 2–4 days of the 7–14 day window as buffer.

| Day | Focus | Deliverable | Tests |
| --- | ----- | ----------- | ----- |
| 1 | Setup + hello-world deploy | Repo scaffolded, Next.js + TS + Tailwind + shadcn/ui, ESLint strict (`no-explicit-any` = error), Vitest configured, deployed to Vercel (empty shell, live URL from day one). Sentry or Vercel error tracking wired. | Vitest runs with a placeholder test. CI pipeline (lint + typecheck + test) green. |
| 2 | Schema + auth backend | Prisma schema (User, Link, Click), migrations committed, Auth.js v5 wired (Credentials provider + Prisma adapter), password hashing (bcrypt via Auth.js), email verification via Resend (Nodemailer fallback documented). Test Neon cold starts — enable "Always On" or connection pooling if needed. | Unit tests: password validation rules, email format validation. Integration test: signup → verify → login flow against test DB. |
| 3 | Auth UI + access control | Signup/login/logout UI, password reset flow (single-use token, 15–30min TTL), session cookies (httpOnly/Secure/SameSite), rate-limited login, row-level ownership checks on every route. | Unit tests: token generation/expiry logic, authorization middleware (owner vs. non-owner vs. admin). |
| 4 | Core URL shortening | Create link (auto short code + custom alias), Zod validation shared client/server, reserved-alias list, edit/delete/disable. | Unit tests: slug generation (collision handling, reserved words, case normalization), Zod schemas (valid/invalid inputs for all fields). |
| 5 | Redirect service + cache | Redirect route, Redis (Upstash) cache for hot lookups, invalid/disabled/expired handling (distinct pages for each state), async click logging (never blocks redirect). | Integration tests: redirect route — cache hit, cache miss, disabled link, expired link, invalid slug. Cache invalidation on edit/delete. |
| 6 | Dashboard | Link list, server-side search (debounced ~300ms), filter (active/disabled/expired), sort, cursor pagination (page size 25, cap 100), all four states (loading/empty/error/success) with skeletons. URL-mirrored filter state. `prisma/seed.ts` for realistic demo data (50+ links, 10K+ clicks). | Unit tests: pagination cursor encoding/decoding, search query sanitization. |
| 7 | Analytics | Click aggregation (browser/device/OS/country/referrer), dashboard stats (total clicks, top links, daily trend). Geo data via Vercel `x-vercel-ip-country` header (Edge Middleware). | Unit tests: UA parsing, click aggregation logic, date range filtering. |
| 8 | Beyond-basics pass | CSV export (streamed), Cmd+K command palette for core actions, immutable audit log per entity. | Unit tests: CSV serialization (escaping, encoding), audit log entry creation. |
| 9 | SEO + polish | Meta tags, OG image (single branded image via `@vercel/og`), sitemap.xml, robots.txt, JSON-LD, Lighthouse pass (target ≥90 all categories), a11y pass (AA contrast, keyboard nav, focus rings), responsive at 320px+. | Lighthouse CI check. Manual a11y audit (keyboard nav, screen reader spot-check). |
| 10 | Harden + ship | Review all tests, fix any gaps, CI green (lint + typecheck + test + build), README/docs finalized, demo video, case study, tagged v1.0.0, message Shreyansh Singh. | All tests pass. Production smoke test: signup → create link → click → verify analytics. |

> **Rule for every day:** If a day's scope isn't done by end of day, cut the day's stretch item — don't bleed into the next day's core work. Deployment stays green from Day 1 onward (deploy on every push, not just at the end).

---

## Scope

### MVP — Everything Below Ships in the 10 Days

**Auth & Access**
- Email + password signup, bcrypt hashing (via Auth.js), email verification gate on writes (via Resend)
- Login, logout, password reset (single-use hashed token, 15–30min TTL)
- httpOnly/Secure/SameSite session cookies, rotated on login and privilege change
- Rate-limited auth endpoints (~5 attempts/15min, exponential backoff)
- Row-level ownership enforced server-side on every route — no role sent from client is trusted
- Two roles: `user` and `admin` — admin is a stub for future moderation (not a full panel); this satisfies server-enforced RBAC without building team workspaces

**URL Management**
- Create, edit, delete, enable/disable links
- Auto-generated short codes + custom aliases (unique, case-insensitive, reserved-list checked)
- Shared Zod schema validates client and server identically

**Redirect Service**
- Sub-200ms redirects, Redis (Upstash) cache for hot links
- Cache invalidation on link edit, delete, or status change
- Invalid / disabled / expired states each get a distinct, informative page
- Click logging happens async — never on the redirect's critical path

**Dashboard**
- Search (server-side, debounced ~300ms), filter (active/disabled/expired), sort, cursor pagination (page size 25, cap 100)
- URL-mirrored filter state (shareable, back-button works)
- Explicit loading/empty/error/success states — skeletons, not spinners
- Realistic seed data for demos

**Analytics**
- Per-link: clicks, browser, OS, device, country, referrer, first/last click
- Dashboard: total clicks, top links, recent activity, daily trend
- Geo data sourced from Vercel `x-vercel-ip-country` header via Edge Middleware

**Beyond Basics**
- CSV export of link table, streamed for large sets
- Cmd+K command palette for core actions
- Immutable audit log per entity

**SEO**
- Unique title/meta description per route, canonical URLs
- Single branded OG image via `@vercel/og`, Twitter card tags
- `sitemap.xml`, `robots.txt`
- `SoftwareApplication` JSON-LD on the landing page
- Lighthouse target: ≥90 across Performance/Accessibility/Best Practices/SEO

**Trust & Safety**
- Framework auto-escaping only, no raw HTML injection
- Parameterized queries via Prisma
- CSP, HSTS, X-Content-Type-Options headers, CSRF protection on mutations
- No secrets in `NEXT_PUBLIC_` vars — verified by grepping the client bundle before ship

**Testing (Distributed)**
- Unit tests written same-day as each feature (not batched)
- Integration tests for critical paths (auth flow, redirect service)
- CI runs lint + typecheck + test on every push
- Production smoke test on Day 10

---

### Bonus (Attempt Only If Day 10 Has Slack)

- Bulk select + bulk actions with confirm step on destructive operations
- E2E test of the core create→click→analytics flow (Playwright)
- Dark mode, system-aware, no flash
- Custom 404 page
- Short architecture write-up on one hard decision (e.g. cache invalidation strategy)

---

### Out of Scope (Explicitly, Until After Submission)

- Team workspaces / multi-tenant orgs
- Public REST API + API keys
- Custom domains
- Webhooks, browser extension, mobile app
- Subscription plans / payments
- Multi-region deployment, Kafka/Redis Streams, ClickHouse
- Docker/VPS deployment — Vercel is the deployment target for this submission, full stop

---

## Tech Stack

| Layer | Choice | Note |
| --- | --- | --- |
| Framework | Next.js (App Router) | Matches brief's recommended default |
| Language | TypeScript, strict mode | No `any` — enforced by ESLint rule |
| UI | React + Tailwind + shadcn/ui | Accessible primitives |
| Database | PostgreSQL via Neon | Serverless, works cleanly with Vercel. "Always On" compute enabled to avoid cold start latency. |
| ORM | Prisma | Migrations committed to git |
| Cache | Redis (Upstash) | Serverless-compatible, hot URL lookups + cache invalidation on mutations |
| Auth | **Auth.js v5** (Credentials provider + Prisma adapter) | Battle-tested, extensive docs, handles session management and CSRF |
| Email | **Resend** (primary) / Nodemailer (fallback) | Resend: 100 emails/day free, great DX, reliable deliverability. Nodemailer documented as fallback if needed. |
| Validation | Zod | Shared client/server schemas |
| Geo | Vercel Edge Middleware | `x-vercel-ip-country` header — available on all Vercel plans |
| Error Monitoring | Sentry (free tier) or Vercel Error Tracking | Wired on Day 1 for production visibility |
| Hosting | **Vercel** | Auto-deploy from GitHub, preview URLs per PR |
| Testing | **Vitest** (unit/integration), Playwright (E2E, bonus) | Tests run in CI on every push |
| Tooling | ESLint (strict), Prettier, GitHub Actions CI | `no-explicit-any` = error from Day 1 |

---

## Functional Requirements

### Redirect Lifecycle

```
Created → Active → (Disabled ⇄ Enabled) → Expired → Deleted
```

Every non-active state (invalid, disabled, expired) renders its own page with a clear message — never a generic error.

### Error Handling

Every route wrapped in a 404 boundary and a caught error boundary. User-facing errors are actionable ("this link has expired" + retry/home CTA); full stack traces are logged server-side only (+ Sentry).

### Accessibility

WCAG 2.1 AA: semantic HTML, 4.5:1 text contrast, 3:1 UI/icon contrast, visible focus rings, full keyboard operability (Tab order, Esc, Enter, Cmd+K), modal focus traps.

### Responsive Design

Mobile-first from 320px. Tables collapse to cards below 640px. Zero horizontal scroll at any breakpoint. Touch targets ≥44px.

---

## Non-Functional Requirements

### Performance Targets

| Operation | Target |
| --- | --- |
| Redirect (cache hit) | < 50ms |
| Redirect (DB lookup) | < 200ms |
| Dashboard load | < 500ms |
| Create short URL | < 300ms |
| Auth actions | < 500ms |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

> **Note:** Neon "Always On" compute mitigates cold start risk. If cold starts still exceed targets, switch to Neon's connection pooling driver (`@neondatabase/serverless`).

### Security

SQL injection (parameterized via Prisma), XSS (auto-escaping only), CSRF (Auth.js built-in + server action protection), session hijacking (rotated cookies), brute force (rate-limited auth), secrets (env vars only, never in client bundle or repo).

### SEO

Treated as a core, scored requirement — not an afterthought bolted on at the end.

---

## Repository Structure

```
linkvault/
├── .github/
│   ├── workflows/ci.yml          # lint + typecheck + test + build
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── architecture.md
│   └── screenshots/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                   # Realistic demo data
├── public/
│   ├── og-image.png
│   └── favicon.ico
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   │   ├── auth.ts               # Auth.js v5 config
│   │   ├── email.ts              # Resend transport
│   │   ├── redis.ts              # Upstash client
│   │   └── validators/           # Shared Zod schemas
│   ├── server/
│   └── types/
├── tests/
│   ├── unit/                     # Vitest unit tests
│   └── integration/              # Vitest integration tests
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── vitest.config.ts
└── README.md
```

---

## Documentation Plan

| Document | Content |
| --- | --- |
| `README.md` | One-line pitch, hero screenshot, live URL + demo login, features (5–8 bullets), quick start, env var table (including `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`), architecture summary, testing commands, roadmap, screenshots, license |
| `docs/architecture.md` | Data model diagram (User/Link/Click + relations), auth flow (Auth.js + Resend email verification), cache strategy (Redis lookup → Postgres fallback → cache write-through, invalidation on mutations), non-obvious decisions and trade-offs |
| `CONTRIBUTING.md` | Local setup, branch naming, commit style, test/lint commands before push |
| `CHANGELOG.md` | Keep a Changelog format, tagged at v1.0.0 |
| API docs | Table of endpoints/server actions: method, path, input, output, auth required |

Docs get written same-day as the feature, not batched at the end.

---

## Deployment Plan

- Push to GitHub Day 1, import into Vercel same day — hello-world live before any feature code
- Sentry/error tracking wired same day
- Neon Postgres provisioned Day 2, `DATABASE_URL` set in Vercel env vars. Test cold starts immediately.
- Resend account created Day 2, `RESEND_API_KEY` set in Vercel env vars
- Upstash Redis provisioned Day 5 alongside redirect service work
- Every push to `main` auto-deploys; every PR gets a preview URL
- CI runs lint + typecheck + test on every push — merges blocked if CI fails
- Before calling it done:
  - Live URL loads with zero console errors
  - Auth works end-to-end in production (not just localhost)
  - Email verification delivers and doesn't land in spam
  - No secrets in the client bundle (checked via Network tab)
  - OG image renders when pasted into Slack/Twitter
  - All tests pass in CI

---

## Submission Checklist

Mirrors the brief's exact review list.

**Product**
- [ ] Live URL loads fast, zero console errors
- [ ] Real auth works on production (signup, verify email, login, reset password)
- [ ] Core CRUD verified by hand
- [ ] Search/filter/sort/pagination behave under realistic seed data
- [ ] Every screen handles loading/empty/error
- [ ] Responsive, keyboard-navigable, passes basic a11y checks

**Code & Repo**
- [ ] TypeScript strict, zero errors; lint + tests pass in CI
- [ ] Unit tests cover critical paths (slug gen, validation, auth, redirect, cache)
- [ ] README with screenshots, quick start, env table, demo login
- [ ] LICENSE, CONTRIBUTING, CHANGELOG, .env.example present
- [ ] Clean commit history, tagged v1.0.0
- [ ] No secrets committed

**Discoverability & Portfolio**
- [ ] Meta tags, OG image, sitemap, robots.txt in place
- [ ] Lighthouse ≥90 on all four categories
- [ ] Demo video recorded, case study written

**Final step**
- [ ] Message Shreyansh Singh (LinkedIn/Instagram) with live URL + repo link

---

## Risks & Mitigation

| Risk | Mitigation |
| --- | --- |
| Scope creep | Every day has a hard stop; unfinished stretch items get cut, not carried over |
| SEO/docs left till the end and rushed | Day 9 dedicated solely to SEO + polish; docs written same-day as features |
| Auth.js integration issues | Auth.js v5 is well-documented with Prisma adapter examples; Credentials provider is straightforward. If blocked, the community is large and responsive. |
| Email deliverability (Resend) | Test on Day 2 immediately after setup. Verify emails don't land in spam. Nodemailer + SMTP documented as fallback. |
| Neon cold starts | "Always On" compute enabled. Tested on Day 2. Fallback: `@neondatabase/serverless` pooling driver. |
| Redis adds complexity | Kept to single responsibility (hot URL lookups). Clear invalidation contract: invalidate on every edit/delete/disable. No streams, no counters, no multi-tier cache. |
| Tests reveal late bugs | Tests written alongside features daily. CI blocks merges on failure. Day 10 is hardening, not first-time testing. |
| Deployment breaks late | Deployed from Day 1, stays green on every push |

---

## Post-Trial Roadmap

Explicitly after submission — not part of this plan's scope or timeline.

- Team workspaces, public REST API + keys, custom domains, webhooks
- Password-protected links, bulk import, UTM builder
- Bulk select + bulk actions with confirm step
- Kafka/Redis Streams for event-driven analytics, ClickHouse
- Kubernetes/Terraform, multi-region, CDN integration
- Prometheus/Grafana observability
- Dark mode (system-aware, no flash)

---

**End of Document**
