# CLAUDE.md — LisboaUX Jobs

## Project Overview

A community-driven UX job board for Portugal, built with Next.js and Supabase. Admins curate job listings, earn gamification points, and new postings are automatically shared to Slack and Telegram channels.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript 5 (strict mode)
- **Runtime:** React 19
- **Database & Auth:** Supabase (PostgreSQL, Row-Level Security, Auth)
- **Styling:** Tailwind CSS 4, shadcn/ui (new-york style), class-variance-authority
- **Forms:** react-hook-form + zod validation
- **Analytics:** PostHog (client + server)
- **Notifications:** Slack webhooks, Telegram bot
- **Package Manager:** pnpm

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm start        # Run production build
pnpm lint         # Run ESLint (eslint-config-next with core-web-vitals + typescript)
```

No test framework is configured — there are no unit or integration tests.

## Project Structure

```
app/
├── (auth)/                  # Auth routes: signup, signin, callback, signout
├── admin/                   # Admin dashboard (requires admin/owner role)
│   ├── jobs/                # Job CRUD management (table + edit sheet)
│   └── leaderboard/         # Team contribution leaderboard
├── api/webhooks/new-job/    # Supabase webhook → Slack + Telegram notifications
├── company/[company]/       # Company-filtered job listings
├── location/[city]/         # Location-filtered job listings (Lisbon, Porto, Braga, Remote)
├── j/[code]/                # Short URL redirects with UTM tracking
├── providers/               # React context providers (PostHog)
├── layout.tsx               # Root layout (fonts, providers, toaster)
├── page.tsx                 # Homepage (job listings + JSON-LD SEO)
└── robots.ts                # Robots.txt generator

components/
├── ui/                      # shadcn/ui primitives (button, card, sheet, dialog, etc.)
├── JobList.tsx              # Main paginated job listing (client component)
├── add-job-sheet.tsx        # Add job form in slide-over sheet
├── LeaderboardChart.tsx     # Bar chart (recharts)
├── leaderboard-toast.tsx    # Points notification toast
└── motto.tsx                # Decorative motto display

lib/
├── supabase/
│   ├── server.ts            # Server-side Supabase client (cookie-based)
│   ├── client.ts            # Browser-side Supabase client
│   ├── admin.ts             # Admin client (bypasses RLS via service role key)
│   ├── middleware.ts         # Session refresh logic
│   └── database.types.ts    # Generated Supabase types
├── actions/jobs.ts          # Server Actions: addJob, updateJob (with points + analytics)
├── posthog/server.ts        # Server-side PostHog event capture
├── seo/jobPostingSchema.ts  # JSON-LD structured data for SEO
├── types.ts                 # Core types (Job)
├── utils.ts                 # Utilities (URL handling, date formatting, cn())
├── telegram.ts              # Telegram bot integration
└── constants.ts             # Constants (PRESET_LOCATIONS)

middleware.ts                # Next.js middleware — refreshes Supabase session on every request
```

## Key Architecture Patterns

### Server vs. Client Components
- **Pages are Server Components by default** — they fetch data server-side via Supabase
- **Interactive components use `'use client'`** — forms, pagination, charts, toasts
- Data flows from server pages → client components via props

### Server Actions (`lib/actions/jobs.ts`)
- All job mutations go through Server Actions (`'use server'`)
- Pattern: authenticate → validate → mutate DB → award points → capture analytics → revalidate caches
- Points: +100 for adding a job, +200 for deactivating a stale job
- Use `useActionState` on the client side to handle form submission

### Supabase Clients
- `createClient()` (server.ts) — standard cookie-based client, respects RLS
- `createBrowserClient()` (client.ts) — for client components
- `createAdminClient()` (admin.ts) — uses service role key, bypasses RLS (for awarding points)

### URL Conventions
- Job URLs are cleaned of tracking params before storage (`cleanTrackingParams()`)
- `utm_source=LisboaUX` is appended at link-click time via `buildJobUrl()`
- Short codes (`/j/[code]`) redirect to the job's external URL

### Dynamic Routes
- `[city]` and `[company]` params use `decodeURIComponent` → case-insensitive `ILIKE` queries
- These routes use `force-dynamic` (no caching)

## Database Schema

### jobs
| Column | Type | Notes |
|--------|------|-------|
| id | int | Primary key |
| title | string | Job title |
| company | string | Company name |
| location | string | City or "Remote" |
| url | string | External job posting URL |
| submitted_on | timestamp | When the job was added |
| is_active | boolean | Whether the listing is live |
| short_code | string? | For `/j/[code]` redirects |
| created_by | uuid? | User who created it |
| modified_by | uuid? | Last user who edited it |
| updated_at | timestamp? | Last edit time |

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | From Supabase Auth |
| email | string | User email |
| username | string? | Display username |
| full_name | string? | Full name |
| avatar_url | string? | Profile picture |
| user_role | enum | `'owner'`, `'admin'`, or `'user'` |
| points | int | Gamification score |
| created_at | timestamp | Account creation |
| updated_at | timestamp | Last profile update |

## Environment Variables

See `.env.example`. Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase publishable (anon) key
- `SUPABASE_SERVICE_ROLE_KEY` — Admin-level Supabase key (server-only)
- `SUPABASE_WEBHOOK_SECRET` — Validates incoming webhook requests
- `SLACK_WEBHOOK_URL` — Slack incoming webhook for job notifications
- `TELEGRAM_BOT_TOKEN` — Telegram bot token for channel notifications
- `TELEGRAM_CHANNEL_ID` — Telegram channel (default: `@ux_jobs`)
- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` — PostHog instance host

## Conventions

### Imports
- Use the `@/` path alias for all imports (maps to project root)
- Example: `import { Job } from '@/lib/types'`

### Styling
- Use Tailwind CSS utility classes exclusively — no CSS modules or styled-components
- Use `cn()` from `@/lib/utils` to merge conditional class names
- Use `class-variance-authority` for component variants
- UI components come from shadcn/ui (`components/ui/`)

### TypeScript
- Strict mode is on — avoid `any` types
- Core types live in `lib/types.ts`; database types in `lib/supabase/database.types.ts`
- Use Zod schemas for form validation (paired with `@hookform/resolvers`)

### Linting
- ESLint 9 flat config with `eslint-config-next` (core-web-vitals + typescript rules)
- Run `pnpm lint` before committing
- No Prettier configured — rely on ESLint formatting rules

### Component Patterns
- Sheet pattern: outer component manages open/close state, inner form receives data as props
- Use `key={entity.id}` on forms to force remount when the selected entity changes
- Toast notifications via `sonner` (use `toast.success()`, `toast.error()`)
- Data tables use `@tanstack/react-table` with column definitions

### Error Handling in Server Actions
- Non-critical failures (points, analytics) are logged but don't fail the request
- Return `{ success: boolean, error?: string }` from all Server Actions
- Always revalidate affected paths with `revalidatePath()` after mutations
