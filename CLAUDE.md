# Transform Creative — Site Context

## Business

**Transform Creative** is an Adelaide-based creative agency offering:
- Video production / media
- Software development
- Graphic design

The site is a portfolio/marketing website showcasing past projects and allowing clients to get in touch.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Router v7 (file-based routing, SSR disabled) |
| Build Tool | Vite v7 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + custom CSS |
| Animations | GSAP v3 (via `@gsap/react`, SplitText plugin) |
| Backend | Supabase (auth + database — see Client Portal) |
| Hosting | Vercel |
| Icons | Ionicons (`@reacticons/ionicons`) |
| Fonts | "SIFONN_PRO" (custom, /public/*.otf) + "Onest" (Google Fonts) |

## Project Structure

```
app/
├── business/        # commonBL.tsx — issue business logic (severity, derived status, AI-status meta, icon mapping)
├── data/
│   ├── CommonTypes.tsx   # Shared app types (e.g. SharedContextProps, AlertType)
│   ├── CustomTypes.tsx   # DB-derived types/aliases (Issue, ClientIssue, Business, …)
│   ├── Objects.tsx       # ALL static data: projects, contact info, client logos
│   └── Ionicons.tsx      # Ionicon type definitions
├── database/
│   ├── SupabaseClient.tsx  # Supabase client init (typed createClient<Database>)
│   ├── supabase.ts         # Generated DB schema types (source of truth)
│   ├── Auth.tsx            # OTP sign-in / sign-out functions
│   ├── Read.tsx            # SELECT queries (getOrgIssues, getUserMembership, …)
│   ├── Create.tsx          # INSERT operations (createIssue, createIssueComment)
│   ├── Update.tsx          # UPDATE operations (updateIssue)
│   └── Delete.tsx          # DELETE operations (scaffold)
├── presentation/
│   ├── HeaderBar.tsx       # Sticky nav, mobile hamburger
│   ├── FooterBar.tsx       # Footer
│   ├── elements/           # Reusable UI: Alert, Icon, Logo, VideoPlayer, etc.
│   ├── landing/            # Home page + all tab sections (Media, Design, Software, Contact, WorkedWith)
│   ├── media/              # Portfolio listing page
│   ├── software/           # Software showcase
│   ├── authentication/     # OTP sign-in form
│   └── client/             # Client portal (ClientPortal, IssueCard, IssueModal)
├── routes/                 # Route-level page components
│   ├── LandingRoute.tsx    # /
│   ├── HomeRoute.tsx       # /home (same content as /)
│   ├── MediaRoute.tsx      # /portfolio
│   ├── ContactRoute.tsx    # /contact
│   ├── DevelopmentRoute.tsx # /development
│   ├── AuthenticationRoute.tsx # /auth
│   ├── ErrorBoundary.tsx   # catch-all route
│   └── ClientRoute.tsx     # /client/:id (clients & agency admins, auth-guarded)
├── root.tsx                # Root layout, session state, alert system, responsive tracking
├── routes.ts               # Route config
└── app.css                 # Global CSS vars, utility classes, animations
```

## Routes

| Path | Component | Notes |
|------|-----------|-------|
| `/` | LandingPage | Hero, animated intro, tabbed portfolio |
| `/home` | LandingPage | Duplicate of `/` |
| `/portfolio` | Portfolio | Project listing with type filters |
| `/contact` | ContactTab | Email CTA |
| `/development` | DevelopmentRoute | Software/development showcase |
| `/auth` | Authentication | Supabase OTP sign-in |
| `/client/:id` | ClientPortal | Logged-in **clients & agency admins** (own portal only). `:id` = the viewer's auth `user_id`. |

## Client Portal

The `/client/:id` route is a private dashboard for clients (see `app/presentation/client/`).

- **`:id`** is the client's auth user id, which equals their `profiles.id` (the `profiles` row PK *is* the auth user id). A client may only view their own portal.
- **Organisations (org-shared issues)**: an **organisation is a `business`**, and membership lives in `profiles_to_businesses`. A client is an **`admin` member of their own org business**; adding more `admin` members to the same business puts those people in one org. **Members of an org share one issue board** — they see, comment on, edit, and delete each other's issues (enforced by RLS, below). Use `select grant_client_access(p_user_id, p_org_id)` to add someone to an org (calling it with the same `p_org_id` for two users groups them).
- **`role = 'admin'` now has two meanings**, disambiguated by whether the business has `client` members:
  - **Agency admin** = admin of an *agency board* (a business that also has `client` members, e.g. Transform Creative = 129). Sees the whole multi-client board.
  - **Org member** = admin of an *org* business (no `client` members). A normal client; their portal shows the org's shared board.
  `getUserMembership` in `Read.tsx` resolves this (an admin row counts as the agency board only if that board has client members) and, for clients, returns their `orgBusinessId`.
- **Issues key columns**: `client_id` = **who posted** the issue (display + linkage only). `client_business_id` = the **org the issue belongs to** and the **source of truth for fetching the client board** (`getOrgIssues`). `business_id` = the **agency board** it was lodged to (e.g. 129) — unchanged, gives the agency full oversight and drives `getBusinessIssues`. The reporter's org and the issue's org can differ (a person may post into an org they don't "own"); always trust `client_business_id`. It's resolved **client-side** and passed in on insert — no DB trigger. (Repo resolution for AI auto-fix uses `client_business_id` to find the org's repo, falling back to `businesses.user_id = client_id` only for legacy null-org issues; see that section.)
- **Tables** (all in Supabase, RLS enabled): `profiles`, `profiles_to_businesses` (membership: `profile_id`, `business_id`, `role`), `businesses`, `issues`, `issue_comments`. `businesses.user_id` (and legacy `businesses.profile`) is the FK to the profile that **owns** the business — but org membership is now the source of truth via `profiles_to_businesses`, not ownership. Generated types live in `app/database/supabase.ts`; app-facing aliases (`Issue`, `IssueComment`, `Business`, `Profile`, `ProfileToBusiness`, `BusinessRole`, `ClientIssue`, `IssueStatus`, …) in `app/data/CustomTypes.tsx`.
- **RLS for the shared board**: `current_user_owns_business(x)` (security-definer) = "am I an `admin` member of business `x`". Issue/comment SELECT/UPDATE/DELETE policies grant access via `client_id = auth.uid()` OR `current_user_owns_business(business_id)` (agency) OR `current_user_owns_business(client_business_id)` (org members). A client may only insert/edit into their own org. `client_org_business_id(uuid)` (security-definer) resolves a client's org id for the admin "log issue for a client" flow (a client's org is otherwise invisible to the agency admin under RLS). See migration `supabase/migrations/20260617010000_org_shared_issues.sql`.
- **Issue severity** (drives the card colour swatch): `low | moderate | severe | critical | future` → see `severityColor()` in `commonBL`.
- **Issue status is derived, not stored** — there is no status column. `deriveIssueStatus()` in `commonBL` infers it from timestamps: `approved` (`approved_at` set) → `awaiting_approval` (`updated_at` set) → `in_progress` (`started_at` set) → `not_started`.
- **DB access is split by CRUD operation** in `app/database/`: `Read.tsx`, `Create.tsx`, `Update.tsx`, `Delete.tsx`. Wired: reads (`getOrgIssues` + `getOrgMembers` for the shared client board, `getClientIssues` as the fallback when a client has no org, `getProfile`, `getUserMembership`, `getBusinessById`, `getBusinessClients`, `getBusinessIssues`, `getClientOrgBusinessId`), inserts (`createIssue`, `createIssueComment`), and `updateIssue` — `IssueModal` uses these for "Log issue", comments, and approve/reject timestamp transitions. `ClientPortal` (client mode) loads `getOrgIssues`/`getOrgMembers` and labels each card with the colleague who posted it. `Delete.tsx` is still a scaffold.

## AI Auto-Fix Pipeline

When a client logs an issue that is **not** `severity = future` and **not**
`issue_type = question`, an AI agent reads the **issue's org** GitHub
repo, makes the change on a new branch, writes/updates tests, and opens a **pull
request** for a human to review and merge. The agent can only ever *propose* —
`main` is protected and the GitHub App has no admin rights.

**Flow:** `issues` INSERT → Supabase Database Webhook → edge function
`dispatch-issue` (fast, <1s: validates, gates, mints a scoped GitHub App token,
fires `workflow_dispatch`) → GitHub Actions `ai-autofix.yml` runs
`anthropics/claude-code-action` (the long agentic work) → PR opened → status
PATCHed back onto the issue → portal shows the PR link or the agent's questions.

- **Repo resolution (important)**: the target repo is the **issue's org**, found
  by `businesses.id = issues.client_business_id`, then reading that row's
  `github_repo` (`owner/repo`) + `ai_autofix_enabled` + `github_default_branch`.
  The org is a `business`; **any admin member** of it (not just its owner) can
  lodge an issue, so the org id — not the reporter's ownership — is the source of
  truth. **Do NOT use `issues.business_id` to pick the repo** — that column is the
  *agency the issue was lodged to* (the board it shows up on, e.g. Transform
  Creative), not where the client's code lives. **Fallback**: for legacy issues
  with no `client_business_id`, the dispatcher falls back to the reporter's owned
  business (`businesses.user_id = issues.client_id`), preferring one with
  `ai_autofix_enabled` + a repo when the client owns more than one.
- **New issue fields** (`app/data/CustomTypes.tsx`): `issue_type` (`bug|issue|question`),
  `more_info`, and the `ai_*` state columns. `ai_status`:
  `queued | processing | pr_open | needs_info | failed | skipped` (null = never
  dispatched). See `aiStatusMeta()` / `ISSUE_TYPE_OPTIONS` in `commonBL`.
- **One run at a time per repo** via the workflow's `concurrency` group; each run
  branches from the latest `main` and reads recent open PRs.
- **The `ai_*` columns are written only by the service role** (edge function /
  workflow), never by clients.
- **Key files**: `supabase/functions/dispatch-issue/index.ts`,
  `.github/workflows/ai-autofix.yml` (canonical template — copied into each client
  repo), `supabase/migrations/`. Setup + ops docs:
  `supabase/AI_AUTOFIX.md` (global) and `docs/ai-autofix-client-repo-setup.md`
  (per-repo onboarding).
- **Security backbone**: GitHub App with no Administration permission, protected
  `main` (human merge), minimal workflow `permissions`, PRs opened via an App
  token (`actions/create-github-app-token`), SHA-pinned actions, secret-gated
  webhook. Treat every AI PR as untrusted code and review it fully.

## Data

Portfolio projects, contact details, and client logos are **all static** — defined in `app/data/Objects.tsx` as a `PROJECTS` array and related constants. Project media is hosted at:
```
https://hzfjmmakqwsmucxorhlb.supabase.co//storage/v1/object/public/transform/
```

The **marketing/portfolio pages are entirely static** (from `Objects.tsx`). Dynamic
database queries are used by the **Client Portal** only (issues, comments,
memberships, businesses) — see that section and `app/database/`.

## Shared State (React Router Outlet Context)

`root.tsx` passes a `SharedContextProps` context down via `useOutletContext()`:

```ts
{
  // (header, body?, isError?) — see PopAlertFn in CommonTypes.tsx
  popAlert: (header: string, body?: string, isError?: boolean) => void,
  session: Session | null,
  navigate: NavigateFunction,
  inShrink: boolean   // true when viewport width < 1200px
}
```

## Styling Conventions

**CSS Variables (defined in app.css):**
```css
--txt: #191919
--bkg: #e2e1d8   /* cream/beige */
--accent: #436940  /* sage green */
--secondaryColor: #de976f /* terracotta */
--thirdColor: #94bc91   /* light green */
```

**Custom utility classes** (avoid re-defining; use what exists):
- Layout: `.col`, `.row`, `.middle`, `.center`
- Width: `.w100`, `.w50`, `.w30`
- Spacing: `.m3`, `.ml3`, `.mr3`, `.mt2`, `.p2`
- Buttons: `.accentButton`, `.boxedAccent`
- Animations: `.spindle`, `.spin360`, `.grow-y`

**Responsive breakpoint**: 1200px (tracked as `inShrink` in root, passed via context).

## Animations

GSAP is used extensively. Key patterns:
- `useGSAP()` hook from `@gsap/react` for React-safe animations
- `SplitText` plugin for character/word-level text animations
- Staggered entrance animations on page load and tab switches
- `gsap.timeline()` for sequenced animations

## Environment Variables

```
VITE_SUPABASE_URL=https://hzfjmmakqwsmucxorhlb.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key>
```

Both are set in `.env.local` and exposed via `import.meta.env.*`.

## Supabase Status

- **Auth**: Configured and working (OTP email magic link)
- **Database**: Connected. The client portal reads from `issues` / `issue_comments` / `profiles` / `profiles_to_businesses` / `businesses` (see `app/database/Read.tsx`). Generated schema types in `app/database/supabase.ts`; the client is typed `createClient<Database>`.
- When adding database features: write a migration in `supabase/migrations/` (apply it to the live project — the repo keeps a `.sql` copy for parity), regenerate `app/database/supabase.ts`, add/adjust the app-facing alias in `app/data/CustomTypes.tsx`, then add typed queries to the matching CRUD file in `app/database/` (`Read`/`Create`/`Update`/`Delete`). Tables have **RLS enabled** — add policies in the migration.

## TypeScript Conventions

- Path alias: `~/` maps to `./app/`
- Shared types live in `app/data/CommonTypes.tsx`
- Each component has a local `Props` interface
- Strict mode enabled — no implicit any

## Key Things to Know

1. **Portfolio content** is all in `Objects.tsx` — add/edit projects there
2. **No server-side rendering** — this is a pure client-side app deployed as static on Vercel
3. **Authentication** uses Supabase OTP only (no passwords)
4. **GSAP SplitText** is a paid plugin — it's already installed; use it freely
5. **Responsive layout** uses the `inShrink` flag passed via context, not just Tailwind breakpoints
6. The `/home` route exists as a duplicate of `/` — likely for navigation convenience

## Key rules
- Never use spans - use appropriate relevant tags instead
- rely on app-v2.css for styling and only use inline style props unless absolutely neccessary. Prefer adding new entries to app-v2.css instead whenever a pattern is likely to be used again. Keep entries in the css file small (2-5 lines ideally) so they can generally be reused more than once and generic (no component specific css classes)
- always import 'app-v2.css' and useOutletContext() in all new files
