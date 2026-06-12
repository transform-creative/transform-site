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
| Backend | Supabase (auth only — database not yet connected) |
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
│   ├── SupabaseClient.tsx  # Supabase client init (env vars)
│   └── Auth.tsx            # OTP sign-in / sign-out functions
├── presentation/
│   ├── HeaderBar.tsx       # Sticky nav, mobile hamburger
│   ├── FooterBar.tsx       # Footer
│   ├── elements/           # Reusable UI: Alert, Icon, Logo, VideoPlayer, etc.
│   ├── landing/            # Home page + all tab sections (Media, Design, Software, Contact, WorkedWith)
│   ├── media/              # Portfolio listing page
│   ├── software/           # Software showcase
│   └── authentication/     # OTP sign-in form
├── routes/                 # Route-level page components
│   ├── LandingRoute.tsx    # /
│   ├── HomeRoute.tsx       # /home (same content as /)
│   ├── MediaRoute.tsx      # /portfolio
│   ├── ContactRoute.tsx    # /contact
│   └── AuthenticationRoute.tsx
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
VITE_SUPABASE_URL=https://xpifawxwcwazatwwhcpf.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable key>
```

Both are set in `.env.local` and exposed via `import.meta.env.*`.

## Supabase Status

- **Auth**: Configured and working (OTP email magic link)
- **Database**: Not yet connected — no tables or queries exist
- When adding database features, create tables and queries via Supabase dashboard first, then add typed queries in `app/database/`

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
