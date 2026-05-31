# Platform Shell & Navigation Design

Date: 2026-05-28  
Status: Approved design  
Related: [2026-05-28-universal-landing-page-design.md](./2026-05-28-universal-landing-page-design.md), [2026-05-27-founder-access-mvp-design.md](./2026-05-27-founder-access-mvp-design.md), [2026-05-28-email-password-auth-design.md](./2026-05-28-email-password-auth-design.md)  
Figma: [SMB Funding Navigator — Founder Access Screens](https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y)  
References: `00 References` → `Reference — User Dashboard` (7:2), `Reference — Admin Dashboard` (8:2), `Reference — Landing` (5:2)

## Goal

Restore visual and navigational coherence across the platform by matching Figma-approved shells per user role, eliminating mixed marketing/product chrome on the same routes, and centralizing all link targets in one navigation module.

## Problem statement

The app currently uses four competing shells (`LandingShell`, `AppShell`, `AuthenticatedShell`, `AdminShell`) with duplicate nav definitions. The same URL (e.g. `/funding`) renders different chrome depending on entry path. `/paperwork` is not middleware-gated while `/funding` is. Product shell brand links to `/` (marketing). Header always shows “Log in” even when signed in. This invalidates the Figma user and admin dashboard references and causes paywall/routing confusion.

## Product decisions (locked)

| Decision | Choice |
|---|---|
| Shell model | **Role-based (Option C)** |
| Unsigned users | Marketing shell only (`Reference — Landing` header) |
| Founders (active subscription) | Product shell (`Reference — User Dashboard` 7:2) |
| Admins | Admin shell on `/admin/*`; product shell on product routes; no checkout paywall |
| Product routes | `/dashboard`, `/funding`, `/paperwork`, `/tasks`, and detail pages under those paths |
| Navigation source of truth | Single `lib/navigation.ts` — no duplicate href lists |
| Figma workflow | Build implementation frames on `02 Product` / `03 Admin` pages from references; code matches frames |
| Landing reference | Unchanged for public/marketing routes |

## Shell matrix

| User state | Shell | Routes | Chrome |
|---|---|---|---|
| Unsigned | Marketing | `/`, `/login`, `/wizard`, `/founder/*`, `/waitlist/*`, `/auth/*` | Horizontal landing header — Log in, Become a Founder |
| Founder (active sub) | Product | `/dashboard`, `/funding`, `/paperwork`, `/tasks`, `/*/[id]` detail pages | Light sidebar + utility top bar — **no** marketing header |
| Admin (allowlisted email) | Admin on `/admin/*`; Product on product routes | `/admin/leads`, `/admin/founders`, `/admin/sources` + product paths | Admin grouped sidebar OR product sidebar per route |
| Signed-in, no sub, not admin | Marketing | Gated product routes redirect to `/founder/checkout` | Checkout uses marketing shell |

## Canonical link map

| Label (Figma-aligned) | Path | Shell | Middleware gate |
|---|---|---|---|
| Dashboard | `/dashboard` | Product | Auth + (active sub OR admin) |
| Funding Matches | `/funding` | Product | Auth + (active sub OR admin) |
| Paperwork Navigator | `/paperwork` | Product | Auth + (active sub OR admin) |
| Forms & Tasks | `/tasks` | Product | Auth + (active sub OR admin) |
| Program detail | `/funding/[programId]` | Product | Same as `/funding` |
| Document detail | `/paperwork/[documentId]` | Product | Same as `/paperwork` |
| Log in | `/login` | Marketing | Public |
| Become a Founder | `/founder/checkout` | Marketing | Public |
| Waitlist leads | `/admin/leads` | Admin | Auth + admin email |
| Founder roster | `/admin/founders` | Admin | Auth + admin email |
| Source management | `/admin/sources` | Admin | Auth + admin email |

### Link behavior fixes

- Add `/paperwork` and `/paperwork/:path*` to middleware product gate (currently missing).
- Migrate `/paperwork`, `/paperwork/[documentId]`, `/funding/[programId]` off `AppShell` to product layout.
- Product shell brand link → `/dashboard` (not `/`).
- Landing header Funding/Paperwork: unsigned → login redirect with `?next=`; signed-in with access → product shell on destination.
- Signed-in users visiting `/` or `/login` → redirect to role home (`/admin/leads` for admin, `/dashboard` for founder, `/founder/checkout` otherwise) via existing post-login resolver.
- Remove duplicate nav arrays from `landing-header.tsx`, `authenticated-shell.tsx`, `admin-shell.tsx` — import from `navigation.ts`.

## Architecture

### Route groups (URLs unchanged)

```text
apps/web/app/
  (marketing)/
    layout.tsx              → MarketingShell
    page.tsx                → /
    login/, wizard/, founder/, waitlist/, auth/

  (product)/
    layout.tsx              → PlatformShell
    dashboard/, funding/, paperwork/, tasks/

  (admin)/
    layout.tsx              → AdminShell
    admin/leads/, admin/founders/, admin/sources/
```

### `lib/navigation.ts`

Exports:

- `PRODUCT_NAV`, `ADMIN_NAV`, `MARKETING_NAV` — label + href constants
- `PRODUCT_PATHS`, `ADMIN_PATHS`, `MARKETING_PATHS` — for middleware
- `resolveShell(pathname, { isSignedIn, isAdmin, hasActiveSub })` → `"marketing" | "product" | "admin"`
- `resolveRoleHome({ isAdmin, hasActiveSub })` → redirect path

### Shell components

| Component | Replaces | Figma source |
|---|---|---|
| `MarketingShell` | `LandingShell`, `AppShell` | Reference — Landing (5:2) |
| `PlatformShell` | `AuthenticatedShell` | Reference — User Dashboard (7:2) |
| `AdminShell` | existing (refined) | Reference — Admin Dashboard (8:2) |

**PlatformShell:**

- 260px light sidebar, `PRODUCT_NAV`, progress card, help card, sign out
- Top utility bar: Maryland-first badge, notification placeholder, user avatar/name
- Main content slot — pages supply content only
- No marketing CTAs in chrome

**AdminShell:**

- Grouped sidebar: Overview (Waitlist leads), Operations (Founder roster, Source management)
- Top bar: title, description, actions slot
- KPI + table content from pages

**MarketingShell:**

- `LandingHeader` + `{children}`
- Cap badge + Become a Founder from billing cap API

### Middleware

```text
productPaths = [/dashboard, /funding, /paperwork, /tasks]
adminPaths = [/admin/leads, /admin/founders, /admin/sources]

1. Admin on /founder/checkout → /admin/leads
2. Product/admin paths without session → /login?next=
3. Admin paths without admin email → /
4. Product paths: admin email → pass; else require active subscription or → /founder/checkout
5. Matcher includes /paperwork/:path*
```

### Page content rules

Product pages render **inside PlatformShell only** — no duplicate page-level app chrome. Use optional shared `PageHeader` for in-content titles (e.g. “Funding matches and readiness programs”) below the utility bar.

Dashboard layout (already partially implemented) follows Figma `7:2` content grid:

- Welcome hero row
- Overall readiness gauge + 3×2 score grid
- Three columns: top matches | next steps | missing docs + progress timeline

Admin pages follow Figma `8:2` minimal MVP: KPI row + table + phase-2 note.

## Figma workflow

### Phase A — Implementation frames (`use_figma`)

File key: `z7GTV3blc0MVceWDkud46Y`

| Page | Frame | Based on |
|---|---|---|
| `02 Product` (new) | `Platform — Dashboard` | Reference 7:2 |
| `02 Product` | `Platform — Funding` | Same shell, list content |
| `03 Admin` (new) | `Admin — Leads` | Reference 8:2 |

Do not modify reference embeds on `00 References`.

### Phase B — Code parity

1. Implement shells to match new Figma frames (tokens: navy `#17324d`, green `#2e7d5b`, blue `#2f80ed`, border `#d9e2ec`, sidebar 260px).
2. Screenshot-compare `/dashboard` and `/admin/leads` vs Figma at 1440px width.
3. Fix alignment regressions before merging.

## Migration order

1. Add `lib/navigation.ts` + expand middleware (`/paperwork` gate).
2. Create route groups + layouts; move pages (no visual change).
3. Implement `PlatformShell` / `MarketingShell` from Figma references.
4. Switch all product + detail pages to product layout.
5. Refine `AdminShell` vs Figma `8:2`.
6. Signed-in redirects from `/` and `/login`.
7. Delete obsolete `AppShell` / duplicate nav; grep for stale hrefs.

## Error handling

| Scenario | Behavior |
|---|---|
| Unsigned hits product URL | Redirect `/login?next=<path>` |
| Founder without sub hits product URL | Redirect `/founder/checkout` |
| Admin hits product URL | Allow (existing admin bypass) |
| Admin hits `/founder/checkout` | Redirect `/admin/leads` |
| Non-admin hits `/admin/*` | Redirect `/` |
| Signed-in hits `/` or `/login` | Redirect role home |

## Out of scope

- Sidebar items not yet built (Messages, Settings, Incentives) — omit or disabled placeholders
- Full admin ops dashboard (review queue, sparklines, forms library CRUD)
- Dashboard deadlines feed, activity log, hero illustration animation
- OAuth / SMS auth
- Changing landing page marketing content (covered by universal landing spec)

## Testing checklist

1. Unsigned: all routes use marketing shell; no sidebar; header links behave per link map
2. Founder: all product nav stays in PlatformShell; no marketing header on product routes
3. Admin: `/admin/*` uses AdminShell; `/dashboard` uses PlatformShell; no checkout paywall
4. `/paperwork` and detail pages gated and use PlatformShell
5. Brand in product shell → `/dashboard`
6. Signed-in `/` and `/login` → role home redirect
7. `npm run build` passes
8. Figma screenshot diff: dashboard + admin leads at 1440px

## Relationship to prior specs

- **Universal landing spec:** Marketing shell unchanged on `/`; this spec adds role-based routing when leaving landing.
- **Founder Access MVP:** Gating and funnel unchanged; fixes `/paperwork` gate gap and shell consistency.
- **Email password auth:** Post-login redirect uses same role home logic; no auth flow changes.
