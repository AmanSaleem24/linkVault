# LinkVault — App Flow

## High-Level System Architecture

```mermaid
graph TB
    subgraph Client ["Browser"]
        LP["Landing Page"]
        AUTH["Auth Pages"]
        DASH["Dashboard"]
        ANALYTICS["Analytics View"]
    end

    subgraph Vercel ["Vercel"]
        EDGE["Edge Middleware"]
        API["Next.js Server Actions"]
        REDIRECT["Redirect Route /[slug]"]
    end

    subgraph Services ["External Services"]
        NEON["Neon Postgres"]
        REDIS["Upstash Redis"]
        RESEND["Resend Email"]
        SENTRY["Sentry"]
    end

    LP --> AUTH
    AUTH --> API
    DASH --> API
    ANALYTICS --> API
    API --> NEON
    API --> REDIS
    API --> RESEND

    EDGE --> REDIRECT
    REDIRECT --> REDIS
    REDIS -->|miss| NEON
    REDIRECT -->|async| NEON

    API --> SENTRY
```

---

## User Flows

### Flow 1: Signup & Email Verification

```mermaid
sequenceDiagram
    actor User
    participant UI as Signup Page
    participant Auth as Auth.js
    participant DB as Postgres
    participant Email as Resend

    User->>UI: Fill name, email, password
    UI->>Auth: POST credentials
    Auth->>Auth: Validate (Zod) + hash password (bcrypt)
    Auth->>DB: INSERT user (verified = false)
    Auth->>Email: Send verification link (token, 30min TTL)
    Email-->>User: 📧 "Verify your email"
    User->>Auth: Click verification link
    Auth->>DB: Mark user verified, delete token
    Auth-->>UI: Redirect to Dashboard
```

### Flow 2: Login

```mermaid
sequenceDiagram
    actor User
    participant UI as Login Page
    participant Auth as Auth.js
    participant DB as Postgres

    User->>UI: Enter email + password
    UI->>Auth: POST credentials
    Auth->>Auth: Rate limit check (5/15min)
    alt Rate limited
        Auth-->>UI: "Too many attempts, try again later"
    else Allowed
        Auth->>DB: Find user by email
        Auth->>Auth: Compare bcrypt hash
        alt Invalid
            Auth-->>UI: "Invalid credentials"
        else Valid + Verified
            Auth->>Auth: Create session, set httpOnly cookie
            Auth-->>UI: Redirect to Dashboard
        else Valid + Not Verified
            Auth-->>UI: "Please verify your email first"
        end
    end
```

### Flow 3: Create Short Link (Core Feature)

```mermaid
sequenceDiagram
    actor User
    participant DASH as Dashboard
    participant API as Server Action
    participant DB as Postgres
    participant REDIS as Redis

    User->>DASH: Click "Create Link"
    DASH->>DASH: Modal opens
    User->>DASH: Paste URL, optionally set custom alias
    DASH->>DASH: Client-side Zod validation
    DASH->>API: createLink({ url, alias? })
    API->>API: Server-side Zod validation
    API->>API: Auth check (session → userId)

    alt Custom alias provided
        API->>API: Check reserved words list
        API->>DB: Check alias uniqueness (case-insensitive)
        alt Alias taken
            API-->>DASH: "This alias is already in use"
        end
    else No alias
        API->>API: Generate random 7-char slug
        API->>DB: Check slug uniqueness (retry if collision)
    end

    API->>DB: INSERT link (userId, originalUrl, slug, status=active)
    API->>REDIS: Cache slug → { url, status }
    API-->>DASH: Return new link with short URL
    DASH->>DASH: Show link in list with copy button
```

### Flow 4: Redirect (The Critical Path)

```mermaid
sequenceDiagram
    actor Visitor
    participant EDGE as Edge Middleware
    participant ROUTE as /[slug] Route
    participant REDIS as Redis
    participant DB as Postgres

    Visitor->>EDGE: GET linkvault.app/abc123
    EDGE->>EDGE: Extract x-vercel-ip-country header
    EDGE->>ROUTE: Forward request + country

    ROUTE->>REDIS: GET slug "abc123"
    alt Cache HIT
        REDIS-->>ROUTE: { url, status }
    else Cache MISS
        ROUTE->>DB: SELECT FROM links WHERE slug = 'abc123'
        alt Link found
            DB-->>ROUTE: { url, status, expiresAt }
            ROUTE->>REDIS: SET slug → { url, status } (TTL 1hr)
        else Not found
            ROUTE-->>Visitor: 404 page "Link not found"
        end
    end

    alt Status = active (and not expired)
        ROUTE-->>Visitor: 302 Redirect → original URL
        Note right of ROUTE: Async (non-blocking):
        ROUTE-)DB: INSERT click (slug, browser, OS, device, country, referrer, timestamp)
    else Status = disabled
        ROUTE-->>Visitor: Custom page "This link has been disabled"
    else Status = expired
        ROUTE-->>Visitor: Custom page "This link has expired"
    end
```

> **Key design decision:** Click logging is fire-and-forget. The visitor gets their redirect in <50ms (cache hit). The click record is written async and never blocks the response.

### Flow 5: Dashboard Experience

```mermaid
flowchart TB
    LOGIN["User logs in"] --> DASH["Dashboard loads"]

    DASH --> STATS["Stats bar: total links, total clicks, top link today"]
    DASH --> LIST["Link list (paginated, 25/page)"]

    LIST --> SEARCH["🔍 Server-side search (debounced 300ms)"]
    LIST --> FILTER["Filter: All / Active / Disabled / Expired"]
    LIST --> SORT["Sort: Newest / Most clicked / Recently clicked"]

    LIST --> ACTIONS["Per-link actions"]
    ACTIONS --> EDIT["Edit URL / alias"]
    ACTIONS --> TOGGLE["Enable / Disable"]
    ACTIONS --> DELETE["Delete (with confirm)"]
    ACTIONS --> VIEW["View analytics"]
    ACTIONS --> COPY["Copy short URL"]

    LIST --> EXPORT["📥 CSV Export (streamed)"]
    LIST --> CMDK["⌘K Command Palette"]

    SEARCH --> URL_STATE["Filter state mirrored in URL params"]
    FILTER --> URL_STATE
    SORT --> URL_STATE
    URL_STATE --> SHAREABLE["Shareable + back-button works"]
```

### Flow 6: Analytics View

```mermaid
flowchart LR
    subgraph PerLink ["Per-Link Analytics"]
        CLICKS["Total clicks"]
        FIRST["First click date"]
        LAST["Last click date"]
        TREND["Daily click trend chart"]
    end

    subgraph Breakdown ["Click Breakdown"]
        BROWSER["By Browser"]
        OS["By OS"]
        DEVICE["By Device"]
        COUNTRY["By Country"]
        REFERRER["By Referrer"]
    end

    subgraph Dashboard ["Dashboard Analytics"]
        TOTAL["Total clicks (all links)"]
        TOP["Top 5 links"]
        RECENT["Recent activity feed"]
        DAILY["Daily trend (last 30 days)"]
    end
```

---

## Data Model

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        boolean emailVerified
        string role "user | admin"
        datetime createdAt
        datetime updatedAt
    }

    LINK {
        string id PK
        string userId FK
        string originalUrl
        string slug UK
        string status "active | disabled | expired"
        datetime expiresAt "nullable"
        datetime createdAt
        datetime updatedAt
    }

    CLICK {
        string id PK
        string linkId FK
        string browser
        string os
        string device
        string country
        string referrer
        datetime clickedAt
    }

    AUDIT_LOG {
        string id PK
        string userId FK
        string entityType "link"
        string entityId
        string action "create | update | delete | disable | enable"
        json previousValue "nullable"
        json newValue "nullable"
        datetime createdAt
    }

    USER ||--o{ LINK : "owns"
    LINK ||--o{ CLICK : "tracks"
    USER ||--o{ AUDIT_LOG : "performed"
```

---

## Page Map

```
/                       → Landing page (public)
/login                  → Login form
/signup                 → Signup form
/verify-email           → Email verification handler
/forgot-password        → Password reset request
/reset-password         → Password reset form (with token)
/dashboard              → Link list + stats (protected)
/dashboard/new          → Create link modal/page
/dashboard/[id]         → Link detail + analytics (protected)
/dashboard/[id]/edit    → Edit link (protected, owner only)
/[slug]                 → Redirect route (public)
/[slug]/disabled        → "Link disabled" page
/[slug]/expired         → "Link expired" page
/404                    → Custom not found page
```

---

## Request Lifecycle Summary

```
Browser Request
    │
    ├─ Public pages (/, /login, /signup)
    │     → Server-rendered, no auth required
    │
    ├─ Protected pages (/dashboard/*)
    │     → Edge Middleware checks session cookie
    │     → No session? Redirect to /login
    │     → Valid session? Server Component fetches data (ownership-scoped queries)
    │
    └─ Redirect route (/[slug])
          → Edge Middleware extracts geo headers
          → Route handler: Redis → Postgres fallback
          → 302 redirect + async click log
```
