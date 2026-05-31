# Platform Shell & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore role-based shells (Marketing, Product, Admin), centralize navigation in `lib/navigation.ts`, gate `/paperwork`, and eliminate mixed chrome on product routes.

**Architecture:** Next.js route groups `(marketing)`, `(product)`, `(admin)` each provide a layout shell. Pages render content only. Middleware and post-login routing import path constants from `navigation.ts`. `PlatformShell` replaces per-page `AuthenticatedShell`; `MarketingShell` replaces `AppShell`/`LandingShell`.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase auth middleware, existing CSS tokens in `globals.css`.

**Design references:**
- Spec: `docs/superpowers/specs/2026-05-28-platform-shell-navigation-design.md`
- Figma: https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y — User Dashboard `7:2`, Admin Dashboard `8:2`

---

## File Structure

```text
apps/web/
  lib/
    navigation.ts                     # NEW — canonical nav + resolveShell + resolveRoleHome
    post-login-routing.ts             # MODIFY — import PRODUCT_PATHS from navigation.ts
  middleware.ts                       # MODIFY — paperwork gate, signed-in / and /login redirect
  components/
    marketing-shell.tsx               # NEW — replaces landing-shell + app-shell
    platform-shell.tsx                # NEW — rename/refactor authenticated-shell
    landing-header.tsx                # MODIFY — import MARKETING_NAV, signed-in link behavior
    admin-shell.tsx                   # MODIFY — import ADMIN_NAV
    authenticated-shell.tsx           # DELETE after platform-shell migration
    app-shell.tsx                     # DELETE
    landing-shell.tsx                 # DELETE
  app/
    layout.tsx                        # unchanged root
    (marketing)/
      layout.tsx                      # MarketingShell
      page.tsx                        # move from app/page.tsx — content only
      login/, wizard/, founder/, waitlist/, auth/
    (product)/
      layout.tsx                      # PlatformShell
      dashboard/, funding/, paperwork/, tasks/
    (admin)/
      layout.tsx                      # pass-through (AdminShell stays page-level for title props)
      admin/leads/, admin/founders/, admin/sources/
```

---

## Task 1: Canonical navigation module

**Files:**
- Create: `apps/web/lib/navigation.ts`
- Test: `apps/web/lib/navigation.test.ts` (optional — verify via build + manual routes)

- [ ] **Step 1: Create navigation.ts**

```typescript
export const PRODUCT_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/funding", label: "Funding Matches" },
  { href: "/paperwork", label: "Paperwork Navigator" },
  { href: "/tasks", label: "Forms & Tasks" },
] as const;

export const ADMIN_NAV = [
  { section: "Overview", items: [{ href: "/admin/leads", label: "Waitlist leads" }] },
  { section: "Operations", items: [
    { href: "/admin/founders", label: "Founder roster" },
    { href: "/admin/sources", label: "Source management" },
  ]},
] as const;

export const MARKETING_NAV = [
  { href: "/funding", label: "Funding", productLink: true },
  { href: "/paperwork", label: "Paperwork", productLink: true },
  { href: "/#features", label: "Incentives", productLink: false },
  { href: "/#how-it-works", label: "Resources", productLink: false },
  { href: "/#about", label: "About", productLink: false },
] as const;

export const PRODUCT_PATHS = PRODUCT_NAV.map((n) => n.href);
export const ADMIN_PATHS = ["/admin/leads", "/admin/founders", "/admin/sources"];
export const MARKETING_PATHS = ["/", "/login", "/wizard", "/founder", "/waitlist", "/auth"];

export type ShellType = "marketing" | "product" | "admin";

export function isProductPath(pathname: string): boolean {
  return PRODUCT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function resolveShell(
  pathname: string,
  ctx: { isSignedIn: boolean; isAdmin: boolean; hasActiveSub: boolean }
): ShellType {
  if (isAdminPath(pathname)) return "admin";
  if (isProductPath(pathname)) {
    if (ctx.isSignedIn && (ctx.isAdmin || ctx.hasActiveSub)) return "product";
    return "marketing";
  }
  return "marketing";
}

export function resolveRoleHome(ctx: { isAdmin: boolean; hasActiveSub: boolean }): string {
  if (ctx.isAdmin) return "/admin/leads";
  if (ctx.hasActiveSub) return "/dashboard";
  return "/founder/checkout";
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd apps/web && npx tsc --noEmit`
Expected: no errors from navigation.ts

---

## Task 2: Middleware — paperwork gate + role-home redirect

**Files:**
- Modify: `apps/web/middleware.ts`
- Modify: `apps/web/lib/post-login-routing.ts`

- [ ] **Step 1: Update middleware imports and paths**

Replace local `gatedPaths` with `PRODUCT_PATHS`, `ADMIN_PATHS` from `@/lib/navigation`. Add `/paperwork/:path*` to matcher.

- [ ] **Step 2: Signed-in redirect from `/` and `/login`**

After session update, if `user` exists and pathname is `/` or `/login`:
- If admin email → redirect `/admin/leads`
- Else fetch subscription; if active → `/dashboard`; else → `/founder/checkout`

- [ ] **Step 3: Update post-login-routing.ts**

Import `isProductPath` from `@/lib/navigation` instead of local `GATED_PRODUCT_PATHS`.

Run: `cd apps/web && npx tsc --noEmit`

---

## Task 3: Shell components

**Files:**
- Create: `apps/web/components/marketing-shell.tsx`
- Create: `apps/web/components/platform-shell.tsx`
- Modify: `apps/web/components/landing-header.tsx`
- Modify: `apps/web/components/admin-shell.tsx`

- [ ] **Step 1: MarketingShell**

Client component: fetch billing cap, render `LandingHeader` + `<main className="page-shell">{children}</main>`.

- [ ] **Step 2: PlatformShell**

Copy `authenticated-shell.tsx`, rename export, import `PRODUCT_NAV`, brand link → `/dashboard`.

- [ ] **Step 3: LandingHeader**

Import `MARKETING_NAV`. Client wrapper resolves Funding/Paperwork hrefs: unsigned → `/login?next=...`; signed-in → product path. Hide "Log in" when signed in; show Dashboard link for signed-in users with access.

- [ ] **Step 4: AdminShell**

Import `ADMIN_NAV` for sidebar sections; remove local `navSections`.

---

## Task 4: Route groups + layouts

**Files:**
- Create: `apps/web/app/(marketing)/layout.tsx`
- Create: `apps/web/app/(product)/layout.tsx`
- Create: `apps/web/app/(admin)/layout.tsx`
- Move pages into route groups (URLs unchanged)

- [ ] **Step 1: Create layouts**

```tsx
// (marketing)/layout.tsx
import { MarketingShell } from "@/components/marketing-shell";
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}

// (product)/layout.tsx
import { PlatformShell } from "@/components/platform-shell";
export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>;
}

// (admin)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Move routes**

```bash
mkdir -p apps/web/app/\(marketing\) apps/web/app/\(product\) apps/web/app/\(admin\)
mv apps/web/app/page.tsx apps/web/app/\(marketing\)/
mv apps/web/app/login apps/web/app/\(marketing\)/
mv apps/web/app/wizard apps/web/app/\(marketing\)/
mv apps/web/app/founder apps/web/app/\(marketing\)/
mv apps/web/app/waitlist apps/web/app/\(marketing\)/
mv apps/web/app/auth apps/web/app/\(marketing\)/
mv apps/web/app/dashboard apps/web/app/\(product\)/
mv apps/web/app/funding apps/web/app/\(product\)/
mv apps/web/app/paperwork apps/web/app/\(product\)/
mv apps/web/app/tasks apps/web/app/\(product\)/
mv apps/web/app/admin apps/web/app/\(admin\)/
```

---

## Task 5: Strip page-level shells

**Files:**
- Modify: all pages under `(marketing)`, `(product)`, `(admin)` that import AppShell, LandingShell, or AuthenticatedShell

- [ ] **Step 1: Marketing pages**

Remove `LandingShell`/`AppShell` wrappers from `(marketing)/page.tsx`, `login`, `wizard`, `founder`, `waitlist`, `auth` pages. Keep inner content only.

- [ ] **Step 2: Product pages**

Remove `AuthenticatedShell`/`AppShell` from `dashboard`, `funding`, `funding/[programId]`, `paperwork`, `paperwork/[documentId]`, `tasks`.

- [ ] **Step 3: Admin pages**

No shell removal needed (AdminShell stays for title/description props).

---

## Task 6: Delete obsolete shells

**Files:**
- Delete: `apps/web/components/app-shell.tsx`
- Delete: `apps/web/components/landing-shell.tsx`
- Delete: `apps/web/components/authenticated-shell.tsx`

- [ ] **Step 1: Grep for stale imports**

Run: `rg "app-shell|landing-shell|authenticated-shell" apps/web`
Expected: no matches

---

## Task 7: Build verification

- [ ] **Step 1: Production build**

Run: `cd apps/web && npm run build`
Expected: PASS

- [ ] **Step 2: Manual checklist (post-build)**

1. Unsigned `/` → marketing shell, no sidebar
2. Founder `/dashboard` → PlatformShell, brand → `/dashboard`
3. `/paperwork` gated in middleware matcher
4. Admin `/admin/leads` → AdminShell; `/dashboard` → PlatformShell

---

## Spec coverage self-review

| Spec requirement | Task |
|---|---|
| Single navigation.ts | Task 1 |
| /paperwork middleware gate | Task 2 |
| Route groups | Task 4 |
| PlatformShell brand → /dashboard | Task 3 |
| Product pages off AppShell | Task 5 |
| Admin nav from navigation.ts | Task 3 |
| Signed-in / and /login redirect | Task 2 |
| Delete AppShell duplicates | Task 6 |
| Figma visual parity | Out of scope for code PR — screenshot diff manual |

## Figma note

Phase A Figma frames (`02 Product`, `03 Admin`) require Figma MCP `use_figma`. If MCP unavailable, code uses existing CSS tokens matching reference colors; visual pass deferred.
