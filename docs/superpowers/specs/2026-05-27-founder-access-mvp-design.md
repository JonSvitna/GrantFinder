# Founder Access MVP Design

Date: 2026-05-27  
Status: Approved design  
FigJam (flow + architecture): [SMB Funding Navigator — Founder Access MVP](https://www.figma.com/board/ajGXOQcJVvylVO9PtQoZRy)  
Figma Design (screens): [SMB Funding Navigator — Founder Access Screens](https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y)  
Open Design (interactive prototype): http://127.0.0.1:55924/ — use `saas-landing` + `dashboard` skills with Stripe/Vercel design system

## Goal

Launch a lead-generation and conversion funnel for SMB Funding Navigator that:

1. Captures free waitlist leads (email + first name).
2. Converts serious founders via live Stripe Checkout at **$19/mo**, locked in for life.
3. Uses the existing wizard as a hook — blurred readiness preview at submit — then unlocks the full product after payment.
4. Enforces a **hard cap of 50 Founder seats**.

Target: ship and post **May 27, 2026**.

## Product decisions (locked)

| Decision | Choice |
|---|---|
| Launch model | Hybrid — free waitlist + paid Founder tier |
| Payment | Stripe Checkout live (subscription) |
| Tier split | Free waitlist = email updates only; paid Founders = immediate full access |
| Pricing | $19/mo recurring; future public price $49/mo (marketing strikethrough) |
| Auth | Supabase magic link (email only, no passwords) |
| Waitlist fields | Email + first name |
| Gating | Wizard public; dashboard/results require active subscription |
| Paywall UX | Blurred readiness category scores; no program names or tasks until checkout |
| Founder cap | Hard cap at 50; block Checkout when full |
| Architecture | **Option A — Next.js-led** (Supabase Auth + Stripe on Vercel; webhooks sync to Railway PostgreSQL) |

## Architecture

### Split responsibilities

```
Landing / Wizard / Paywall / Auth UI     →  Next.js (Vercel)
Stripe Checkout session creation         →  Next.js API routes
Supabase Auth (magic links, JWT)         →  Supabase + Next.js SSR middleware
Profile · matching · readiness · tasks   →  FastAPI (Railway) — unchanged core
Stripe webhooks · subscription state     →  FastAPI (Railway)
PostgreSQL                               →  Railway — source of truth for users, waitlist, subs
```

### Auth and billing flow

1. User completes wizard (public) → backend computes full plan server-side.
2. Non-Founder caller receives gated preview (blurred scores only).
3. User clicks **Unlock for $19/mo** → Next.js checks cap → creates Stripe Checkout session.
4. Payment succeeds → Stripe webhook sets `subscription_status = active`, assigns `founder_number`.
5. User lands on `/founder/welcome` → Supabase magic link sent to checkout email.
6. User clicks magic link → session established → pending profile linked → full dashboard.

### User linking

Extend existing `users` table. Link `supabase_user_id` to `auth.users.id`. Wizard may create email-only users before auth; magic-link login attaches Supabase ID to the same row.

## Database

### New table: `waitlist_leads`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | string, unique | lowercased |
| `first_name` | string | required |
| `source` | string | `landing_hero`, `landing_footer`, `paywall`, `founder_page` |
| `created_at` | timestamp | |

### Extend `users`

| Column | Type | Notes |
|---|---|---|
| `first_name` | string, nullable | |
| `supabase_user_id` | string, unique, nullable | |
| `stripe_customer_id` | string, unique, nullable | |
| `stripe_subscription_id` | string, unique, nullable | |
| `subscription_status` | string | default `none`; values: `none`, `active`, `past_due`, `canceled` |
| `founder_number` | int, unique, nullable | 1–50 |
| `founder_locked_price` | string | default `"19.00"` |
| `subscribed_at` | timestamp, nullable | |

Index on `subscription_status` for cap queries.

### Optional: `stripe_events`

Store processed Stripe `event.id` values for webhook idempotency.

## API

### Public

- `POST /waitlist` — `{ email, first_name, source }` → 201 create, 200 if duplicate (idempotent success to user).

### Authenticated (Supabase JWT)

- `GET /me/subscription` — `{ status, founder_number, spots_remaining, email }` for middleware gating.

### Wizard (extended)

- Existing profile submit endpoint computes full dashboard always.
- Non-active subscription → `{ preview: true, categories: [...], blurred: true }` — category labels visible, numeric scores obscured, no program names or tasks.
- Active subscription → full dashboard response (current behavior).
- Profile persisted against email even when gated so post-payment unlock is instant.

### Webhooks

- `POST /webhooks/stripe` — verify `Stripe-Signature`; handle:
  - `checkout.session.completed` → link customer/sub, set active, assign `founder_number` in transaction with cap check
  - `customer.subscription.updated` → sync `active` / `past_due`
  - `customer.subscription.deleted` → set `canceled`

### Admin (JWT + `ADMIN_EMAILS` allowlist)

- `GET /admin/leads` — list + `?format=csv`
- `GET /admin/founders` — roster + seat count

## Next.js API routes

| Route | Role |
|---|---|
| `POST /api/waitlist` | Proxy to FastAPI |
| `POST /api/checkout/founder` | Cap check → Stripe Checkout session |
| `GET /api/checkout/status` | Optional post-redirect poll |

## Route gating (middleware)

| Route | Access |
|---|---|
| `/`, `/wizard`, `/login`, `/founder/*`, `/paperwork` (read-only) | Public |
| `/dashboard`, `/funding`, `/tasks` | Supabase session + `subscription_status = active` |
| `/admin/*` | Session + admin allowlist |

Middleware calls `GET /me/subscription` with JWT; cache result ~5 minutes.

## Frontend pages

### Ship tomorrow (high fidelity)

**Landing `/`**

> **Note:** Hero tier-card layout superseded by universal landing spec (2026-05-28). See [2026-05-28-universal-landing-page-design.md](./2026-05-28-universal-landing-page-design.md).

- Dual-tier hero: free waitlist form + Founder card with live spots counter.
- Primary CTA: **Find Funding & Paperwork Steps** → `/wizard`.
- Header: **Log in** (magic link) + **Become a Founder**.
- Feature grid, how-it-works, checklist preview, common forms row, footer waitlist — aligned with attached mockup direction.

**Wizard `/wizard`**

- Keep 7 backend steps; sidebar grouped into 4 visual stages.
- `localStorage` draft auto-save.
- Restyle funding-needs as icon cards (same payload).
- Submit → `/wizard/unlock` for non-Founders.

**Paywall `/wizard/unlock`**

- Six readiness gauges: category names visible, values blurred.
- CTAs: Unlock $19/mo · Join waitlist · Edit answers.
- Sold-out state when cap reached.

**Founder flow**

- `/founder/checkout` — standalone pitch + Stripe CTA
- `/founder/welcome` — post-payment; poll subscription up to 30s
- `/waitlist/thanks` — confirmation

**Auth**

- `/login` — request magic link
- `/auth/callback` — Supabase code exchange

**Dashboard `/dashboard` (simplified vs mockup, fully functional)**

- New `AuthenticatedShell` with sidebar.
- Ship: readiness scores, top funding matches, tasks/steps, missing documents.
- Placeholder/skip: deadlines feed, activity log, progress timeline animation, hero illustration.

**Admin (minimal)**

- `/admin/leads` — CSV export
- `/admin/founders` — roster + seat count
- Keep existing `/admin/sources`; defer full ops dashboard from mockup.

### Phase 2 (explicitly deferred)

- Live wizard match preview panel (right sidebar in wizard mockup)
- Full admin dashboard (review queue, ingestion, KPI sparklines)
- Stripe Customer Portal
- Transactional email automation (Resend/Postmark)
- Password/OAuth auth
- Deadline engine, activity feed, document uploads

## Environment variables

**Vercel**

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_FOUNDER_PRICE_ID
NEXT_PUBLIC_API_BASE_URL
ADMIN_EMAILS
```

**Railway**

```text
DATABASE_URL
STRIPE_WEBHOOK_SECRET
SUPABASE_JWT_SECRET
ADMIN_EMAILS
CORS_ORIGINS
ENVIRONMENT
```

**Stripe Dashboard**

- Product: Founder Access
- Price: $19/month recurring (dedicated Price ID — never mutate for locked-in Founders)
- Webhook: `https://<railway-api>/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Error handling

| Scenario | Behavior |
|---|---|
| Duplicate waitlist email | Success message: already on the list |
| Cap reached | Sold-out UI; waitlist only |
| Checkout canceled | Return to `/founder/checkout?canceled=1` |
| Magic link expired | Resend prompt on `/login` |
| Webhook delayed after payment | Welcome page polls up to 30s; fallback copy |
| Invalid webhook signature | 400 + log; Stripe retries |
| Subscription canceled | Redirect to reactivation checkout |
| API error on wizard submit | Error message; draft retained in localStorage |

## Cap enforcement

Before creating Checkout session:

```sql
SELECT COUNT(*) FROM users
WHERE subscription_status = 'active' AND founder_number IS NOT NULL;
```

If `>= 50` → return `409 FOUNDER_CAP_REACHED`.

In webhook handler: assign `founder_number` inside a transaction with `SELECT … FOR UPDATE` to prevent race conditions on the 50th seat.

## Launch verification checklist

1. Waitlist submit → row in DB → visible in `/admin/leads`
2. Anonymous wizard complete → blurred paywall (no program names)
3. Stripe test Checkout → webhook → `founder_number` assigned
4. Magic link login → full dashboard with real scores
5. 50 active founders in staging → Checkout blocked
6. Canceled subscription → `/dashboard` redirects to reactivation

## Success criteria

- Landing live with dual-tier CTAs and live spot counter
- End-to-end funnel works in Stripe test mode: wizard → paywall → checkout → magic link → dashboard
- 50-seat hard cap enforced
- Admin can export waitlist and view founder roster

## Relationship to prior spec

This design extends [2026-05-26-smb-funding-navigator-deployment-first-design.md](./2026-05-26-smb-funding-navigator-deployment-first-design.md). The core matching engine, wizard fields, dashboard data model, and Railway/Vercel split remain unchanged. This spec adds authentication, billing, gating, waitlist capture, and Founder conversion on top of the deployed MVP.
