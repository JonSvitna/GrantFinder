# Email OTP Auth Design

Date: 2026-05-28  
Status: Approved design  
Supersedes: Auth portions of [2026-05-27-founder-access-mvp-design.md](./2026-05-27-founder-access-mvp-design.md) (magic link as primary login — funnel and gating unchanged)  
Related: [2026-05-28-universal-landing-page-design.md](./2026-05-28-universal-landing-page-design.md)

## Goal

Replace magic-link-only login with **email OTP (6-digit code)** so every user — founders, admins, and testers — can sign in reliably **regardless of email client or browser**.

Magic links fail when opened in Gmail, Outlook, Apple Mail, or other in-app browsers because Supabase PKCE verifier cookies live in the browser where the code was requested, not where the link opens. Users reported **`about:blank`** and never reaching the app.

## Product decisions (locked)

| Decision | Choice |
|---|---|
| Primary login | Email + **6-digit OTP** entered on `/login` (same page / same browser session) |
| Magic link | **Not** primary login; optional legacy via `/auth/callback` only |
| Passwords | No — remain passwordless |
| Auth provider | Keep Supabase Auth (JWT, SSR cookies, middleware) |
| Email clients | Must work with **Gmail, Outlook, Yahoo, Apple Mail, mobile in-app browsers** |
| Cross-browser rule | User may read email in **any** client; they copy/type the code on the login page — **no click-to-login dependency** |
| Founder welcome | Post-checkout sign-in uses **same OTP UI**, not auto-sent magic link |
| Admin access | Unchanged — `ADMIN_EMAILS` allowlist + session |
| Subscription gating | Unchanged — middleware + `/api/me/subscription` |

## Why OTP satisfies the cross-client requirement

| Flow | Gmail in-app | Outlook mobile | Same browser only? |
|---|---|---|---|
| Magic link + PKCE | Fails (no verifier cookie) | Often fails | Yes — fragile |
| Email OTP code | Works (user copies code) | Works | No — code works anywhere |

The code is verified with `verifyOtp()` on the page where the user typed their email. Reading email in Outlook on a phone and entering the code on a laptop is supported.

## Login UX — `/login`

### Step 1: Request code

- Email input (required, validated)
- Button: **Send sign-in code**
- Copy: “We’ll email you a 6-digit code. Enter it on this page to sign in — works with any email app.”
- Do **not** pass `emailRedirectTo` on this call (avoids generating link-first emails for routine login)

```ts
await supabase.auth.signInWithOtp({ email });
```

### Step 2: Verify code

- 6-digit numeric input
- Button: **Verify & sign in**
- **Resend code** (disabled 60s after send)
- **Use a different email** (return to step 1)
- Support `?next=/admin/leads` (or other gated path) from middleware redirect

```ts
await supabase.auth.verifyOtp({ email, token, type: "email" });
```

### Step 3: Redirect (client-side)

After successful `verifyOtp`, call shared helper `resolvePostLoginPath({ next, accessToken })`:

| Condition | Destination |
|---|---|
| `next` starts with `/admin/` and user is admin | `next` |
| Active founder subscription (`status === "active"`) | `next` if gated product path, else `/dashboard` |
| Admin email, no active subscription | `/admin/leads` |
| Otherwise | `/founder/checkout` |

## Supabase email template

Update the Supabase Auth **Magic Link / OTP** template for project `aohkbfydnpacrddtiiqu` (or dedicated GrantFinder project when migrated):

- **Subject:** `Your SMB Funding Navigator sign-in code`
- **Body:** Prominent 6-digit token via `{{ .Token }}`
- **Instruction:** “Enter this code on the login page at [site URL]. Do not share this code.”
- **Optional:** Small footer link `{{ .ConfirmationURL }}` labeled “Open login page” — not “click to sign in”
- Remove language implying one-click login is required

## Founder welcome — `/founder/welcome`

After Stripe payment confirms:

1. Poll subscription as today
2. If user has no session: show inline OTP form (reuse `AuthOtpForm`), email pre-filled from checkout
3. Remove auto `signInWithOtp` with `emailRedirectTo` on mount
4. Success copy: “Payment confirmed — enter your sign-in code to open your dashboard.”

## Components and files

| File | Change |
|---|---|
| `apps/web/components/auth-otp-form.tsx` | **New** — two-step OTP UI (props: `defaultEmail`, `next`, `onSuccess`) |
| `apps/web/app/login/page.tsx` | Replace magic-link-only form with `AuthOtpForm` |
| `apps/web/app/founder/welcome/page.tsx` | Replace magic-link auto-send with `AuthOtpForm` when unsigned |
| `apps/web/lib/post-login-routing.ts` | **New** — `resolvePostLoginPath()` |
| `apps/web/app/auth/callback/route.ts` | Keep for legacy links; delegate redirect to same helper |
| Supabase dashboard | Email template + redirect URLs (site URL only, not link-dependent login) |

## Architecture (unchanged vs changed)

**Unchanged:**

- Supabase Auth + `@supabase/ssr` middleware
- FastAPI `get_current_user` + JWT secret
- `ADMIN_EMAILS` on web middleware and API
- Stripe checkout, webhooks, 50-seat cap
- Route gating in `middleware.ts`

**Changed:**

- Primary sign-in mechanism: OTP not magic link
- Login and welcome copy
- Supabase email template
- Founder Access spec auth row (superseded by this doc)

## Error handling

| Case | User message |
|---|---|
| Invalid or expired code | “That code didn’t work. Check the latest email or request a new code.” |
| Rate limited | “Too many attempts. Wait a minute and try again.” |
| Send OTP failed | Show Supabase error or generic retry |
| Verified but API subscription check fails | Signed in; redirect to checkout with banner |
| Session expired later | Middleware → `/login?next=…` |

## Security

- OTP expiry: Supabase default (typically 60 minutes; confirm in project settings)
- Rate limits: Supabase Auth built-in; no custom backend needed for MVP
- Do not expose whether email exists in waitlist/users on send (generic confirmation copy)
- Codes are single-use; resend invalidates prior code per Supabase behavior

## Testing checklist

1. Request code on `/login` in Chrome → open email in **Gmail app** → enter code on Chrome → lands on `/dashboard` or `/admin/leads`
2. Same flow with **Outlook** (web or mobile) reading the email
3. Admin email without subscription → `/admin/leads` after OTP
4. Founder with active sub → `/dashboard`
5. Non-founder without sub → `/founder/checkout`
6. Post-checkout `/founder/welcome` OTP path without magic link
7. No `about:blank` on primary login path
8. `npm run build` passes; existing auth middleware tests pass

## Out of scope

- Email + password auth
- OAuth (Google, Microsoft)
- Replacing Supabase with Clerk/Auth0
- Dedicated GrantFinder Supabase project migration (infra follow-up)
- SMS OTP

## Relationship to Founder Access MVP

This spec changes **only how users establish a session**. It does not change:

- Waitlist capture, Stripe Checkout, or webhooks
- Wizard paywall or blurred preview
- Founder cap enforcement
- Dashboard or admin feature set

Magic link remains documented as deprecated for primary login. Funnel step “magic link → dashboard” becomes “OTP → dashboard” on welcome and login pages.
