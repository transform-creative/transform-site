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
├── business/        # Utility functions (e.g. icon mapping)
├── data/
│   ├── CommonTypes.tsx   # Shared TypeScript types
│   ├── Objects.tsx       # ALL static data: projects, contact info, client logos
│   └── Ionicons.tsx      # Ionicon type definitions
├── database/
│   ├── SupabaseClient.tsx  # Supabase client init (typed createClient<Database>)
│   ├── supabase.ts         # Generated DB schema types (source of truth)
│   ├── Auth.tsx            # OTP sign-in / sign-out functions
│   ├── Read.tsx            # SELECT queries (getClientIssues, getAuthClient)
│   ├── Create.tsx          # INSERT operations (scaffold)
│   ├── Update.tsx          # UPDATE operations (scaffold)
│   └── Delete.tsx          # DELETE operations (scaffold)
├── presentation/
│   ├── HeaderBar.tsx       # Sticky nav, mobile hamburger
│   ├── FooterBar.tsx       # Footer
│   ├── elements/           # Reusable UI: Alert, Icon, Logo, VideoPlayer, etc.
│   ├── landing/            # Home page + all tab sections (Media, Design, Software, Contact, WorkedWith)
│   ├── media/              # Portfolio listing page
│   ├── software/           # Software showcase
│   ├── authentication/     # OTP sign-in form
│   └── client/             # Client portal (ClientPortal, IssueCard)
├── routes/                 # Route-level page components
│   ├── LandingRoute.tsx    # /
│   ├── HomeRoute.tsx       # /home (same content as /)
│   ├── MediaRoute.tsx      # /portfolio
│   ├── ContactRoute.tsx    # /contact
│   ├── AuthenticationRoute.tsx
│   └── ClientRoute.tsx     # /client/:id (clients only, auth-guarded)
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
| `/authentication` | Authentication | Supabase OTP sign-in |
| `/client/:id` | ClientPortal | Logged-in **clients only**. `:id` = the client's auth `user_id`. |

## Client Portal

The `/client/:id` route is a private dashboard for clients (see `app/presentation/client/`).

- **`:id`** is the client's auth user id, which equals their `profiles.id` (the `profiles` row PK *is* the auth user id). A client may only view their own portal.
- **Client vs admin detection**: a client is any signed-in user who has a `profiles_to_businesses` row with `role = 'client'`; `role = 'admin'` marks a business admin. (`getUserMembership` in `Read.tsx` resolves this, preferring an `admin` row.)
- **Tables** (all in Supabase, RLS enabled): `profiles`, `profiles_to_businesses` (membership: `profile_id`, `business_id`, `role`), `businesses`, `issues`, `issue_comments`. `businesses.user_id` is the FK to the profile that **owns** the business. Generated types live in `app/database/supabase.ts`; app-facing aliases (`Issue`, `IssueComment`, `Business`, `Profile`, `ProfileToBusiness`, `BusinessRole`, `ClientIssue`, `IssueStatus`, …) in `app/data/CustomTypes.tsx`. ⚠️ The generated `supabase.ts` still contains stale `auth_clients` / `clients_to_businesses` table defs — those tables have been dropped; ignore them and regenerate when convenient.
- **Issue severity** (drives the card colour swatch): `low | moderate | severe | critical | future` → see `severityColor()` in `commonBL`.
- **Issue status is derived, not stored** — there is no status column. `deriveIssueStatus()` in `commonBL` infers it from timestamps: `approved` (`approved_at` set) → `awaiting_approval` (`updated_at` set) → `in_progress` (`started_at` set) → `not_started`.
- **DB access is split by CRUD operation** in `app/database/`: `Read.tsx`, `Create.tsx`, `Update.tsx`, `Delete.tsx`. Wired: reads (`getClientIssues`, `getProfile`, `getUserMembership`, `getBusinessById`, `getBusinessClients`, `getBusinessIssues`), inserts (`createIssue`, `createIssueComment`), and `updateIssue` — `IssueModal` uses these for "Log issue", comments, and approve/reject timestamp transitions. `Delete.tsx` is still a scaffold.

## AI Auto-Fix Pipeline

When a client logs an issue that is **not** `severity = future` and **not**
`issue_type = question`, an AI agent reads the **reporting client's own** GitHub
repo, makes the change on a new branch, writes/updates tests, and opens a **pull
request** for a human to review and merge. The agent can only ever *propose* —
`main` is protected and the GitHub App has no admin rights.

**Flow:** `issues` INSERT → Supabase Database Webhook → edge function
`dispatch-issue` (fast, <1s: validates, gates, mints a scoped GitHub App token,
fires `workflow_dispatch`) → GitHub Actions `ai-autofix.yml` runs
`anthropics/claude-code-action` (the long agentic work) → PR opened → status
PATCHed back onto the issue → portal shows the PR link or the agent's questions.

- **Repo resolution (important)**: the target repo is the **reporting client's
  own** business, found by `businesses.user_id = issues.client_id`, then reading
  that row's `github_repo` (`owner/repo`) + `ai_autofix_enabled` +
  `github_default_branch`. **Do NOT use `issues.business_id` to pick the repo** —
  that column is the *agency the issue was lodged to* (the board it shows up on,
  e.g. Transform Creative), not where the client's code lives. `businesses.user_id`
  is the FK to the profile that **owns** that business. If a client owns more than
  one business, the dispatcher prefers one with `ai_autofix_enabled` + a repo.
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

No dynamic database queries exist yet. Supabase is initialised (env vars configured) but only used for authentication.

## Shared State (React Router Outlet Context)

`root.tsx` passes a `SharedContextProps` context down via `useOutletContext()`:

```ts
{
  popAlert: (message: string, type: AlertType) => void,
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
- **Database**: Connected. The client portal reads from `issues` / `issue_comments` / `auth_clients` (see `app/database/Read.tsx`). Generated schema types in `app/database/supabase.ts`; the client is typed `createClient<Database>`.
- When adding database features, create tables via Supabase dashboard, regenerate `app/database/supabase.ts`, then add typed queries to the matching CRUD file in `app/database/` (`Read`/`Create`/`Update`/`Delete`).

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
- rely on app-v2.css for styling and only use inline style props unless absolutely neccessary. Even the prefer adding new entries to app-v2.css instead where a pattern is likely to be used again. Keep entries in the css file small (2-5 lines ideally) so they can generally be reused more than once
- always import 'app-v2.css' and useOutletContext() in all new files
