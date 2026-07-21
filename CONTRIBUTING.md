# Contributing to LinkVault

Thanks for your interest in contributing. This document covers the setup, conventions, and review process so your PR lands cleanly.

## Code of Conduct

Be respectful. Keep feedback specific and actionable. We're all here to improve the project.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10
- A Neon Postgres database (free tier works)
- An Upstash Redis instance

### Local Setup

```bash
# Fork and clone your fork
git clone https://github.com/<your-username>/linkVault.git
cd linkVault

# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env

# Generate Prisma client and push schema
pnpm db:generate
pnpm db:push

# Start the dev server
pnpm dev
```

## Project Conventions

### TypeScript

- Strict mode is enforced (`tsconfig.json`: `"strict": true`).
- Path alias: use `@/` to import from `src/` (e.g., `import { auth } from '@/lib/auth'`).
- No `any` types. Use `unknown` with narrowing, or define proper interfaces.

### Server Actions

All server actions in `src/app/actions/` follow this pattern:

1. `'use server'` at the top of the file.
2. Validate input with a Zod schema from `src/lib/validators/index.ts`.
3. Authenticate with `auth()` from `@/lib/auth` for protected actions.
4. Enforce row-level ownership (`resource.userId === session.user.id`).
5. Return `{ success: true, data? }` or `{ success: false, error }`.

### Components

- Client components are in `src/components/` and use the `'use client'` directive.
- UI primitives come from `src/components/ui/` (shadcn/ui via base-ui).
- Use `cn()` from `@/lib/utils` for conditional class merging.
- Favor composition over configuration. Don't add props that toggle layout behavior — make a new component.

### Database

- All schema changes go through Prisma migrations (`pnpm db:migrate`), never `db:push` on shared branches.
- Queries should use the Prisma client from `@/lib/prisma`.
- Add database-level indexes for any new query pattern that will be called frequently.

### Caching

- Link lookups are cached in Redis via `LINK_CACHE_KEY(slug)` with a 1-hour TTL.
- Any server action that mutates a link must invalidate its Redis cache entry after the DB write.

### Naming

- Files: `kebab-case.ts` for utilities and configs, `PascalCase.tsx` for components.
- Server action files: match the resource (`links.ts`, `auth.ts`).
- Zod schemas: descriptive nouns (`createLinkSchema`, `updateLinkSchema`).
- Database columns: `camelCase` as defined in the Prisma schema.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must match:

```
<type>(<scope>): <description>
```

| Type | Use for |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, missing semicolons, etc. (no logic change) |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependencies, tooling |
| `sec` | Security-related changes |
| `docs` | Documentation only |
| `perf` | Performance improvement |

**Scope is required** — it tells reviewers and changelog generators what area of the codebase is affected. Use one of the existing scopes (e.g., `auth`, `links`, `dashboard`, `analytics`, `db`, `ci`) or create a new one if you're adding a new subsystem.

**Body is optional but encouraged** for non-trivial changes. Explain the why, not the what.

**Breaking changes**: append `BREAKING CHANGE:` in the body, and end the description with `!` (e.g., `feat(auth)!: migrate sessions to database`).

### Examples

```
feat(links): add slug availability check before creation
fix(auth): prevent session reuse after password reset
refactor(dashboard): extract LinkCard into shared component
chci: pin pnpm version in CI workflow
sec(auth): enforce bcrypt minimum rounds via server-side validation
```

## Pull Request Process

### Before You Open a PR

1. Create a feature branch from `main`: `git checkout -b feat/your-feature-name`
2. Make your changes, committing with conventional commit messages.
3. Run the full check suite locally:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
```

4. If your change touches the database schema, include the migration file in your PR.

### PR Guidelines

- **One concern per PR.** Don't bundle refactors with features.
- **PR title** should be a clear summary. If it touches multiple scopes, use the most significant one or prefix with `chore` for cross-cutting changes.
- **PR description** should explain:
  - What changed and why.
  - How you tested it (manual steps, screenshots for UI changes).
  - Any migration or environment changes required.
- Keep PRs under ~400 lines of diff where possible. Larger changes should be split into linked PRs or discussed in an issue first.
- Link related issues with keywords (`Closes #123`, `Fixes #123`).

### Review Criteria

A PR will be approved when it:

1. Passes CI (lint, typecheck, unit tests, build).
2. Follows the commit and code conventions above.
3. Doesn't introduce `any` types, unused variables, or commented-out code.
4. Includes or updates tests for any new behavior.
5. Doesn't break existing functionality (verified by passing tests and manual review).

## Running Tests

```bash
# Unit tests (no database required)
pnpm test:unit

# All tests (requires a database)
pnpm test

# Watch mode for development
pnpm test:watch
```

Tests live in `tests/unit/`. Name test files to match the module under test (e.g., `slugs-and-validators.test.ts` covers `src/lib/slugs.ts` and `src/lib/validators/index.ts`).

## Questions?

Open an issue for bugs and feature proposals. For questions about the codebase, check the [README](./README.md) first — it covers the architecture and data model in detail.
