# Founder Access MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Founder Access launch funnel — free waitlist capture, $19/mo Stripe Checkout, Supabase magic-link auth, wizard paywall with blurred preview, 50-seat cap, and gated dashboard — on top of the existing SMB Funding Navigator MVP.

**Architecture:** Option A (Next.js-led). Supabase Auth + Stripe Checkout live in `apps/web` API routes and middleware. FastAPI on Railway owns waitlist persistence, subscription state, profile gating, Stripe webhooks, and admin exports. PostgreSQL remains source of truth.

**Tech Stack:** Next.js 16, `@supabase/ssr`, Stripe Node SDK, FastAPI, SQLAlchemy, Alembic, PyJWT, pytest.

**Design references:**
- Spec: `docs/superpowers/specs/2026-05-27-founder-access-mvp-design.md`
- FigJam flow: https://www.figma.com/board/ajGXOQcJVvylVO9PtQoZRy
- Figma screens: https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y

---

## File Structure

```text
apps/api/
  app/
    auth.py                          # Supabase JWT verification dependency
    config.py                        # + stripe_webhook_secret, supabase_jwt_secret, admin_emails
    models.py                        # + WaitlistLead, StripeEvent; extend User
    schemas.py                       # + WaitlistInput, SubscriptionStatus, PreviewDashboard
    services/
      subscriptions.py               # cap count, assign founder_number, status helpers
      stripe_webhooks.py             # event handlers + idempotency
    api/
      routes.py                      # wire new routers / extend profile submit
      waitlist.py                    # POST /waitlist
      billing.py                     # GET /me/subscription, POST /webhooks/stripe, GET /billing/cap
      admin_billing.py               # GET /admin/leads, GET /admin/founders
    migrations/versions/
      20260527_0002_founder_access.py
  tests/
    test_waitlist.py
    test_subscriptions.py
    test_stripe_webhook.py
    test_profile_gating.py

apps/web/
  middleware.ts                      # Supabase session refresh + route gating
  .env.example                       # Supabase, Stripe, admin vars
  lib/
    supabase/client.ts
    supabase/server.ts
    supabase/middleware.ts
    stripe.ts
    subscription.ts                  # fetch /me/subscription for middleware
    types.ts                         # + PreviewDashboardPayload, WaitlistInput
    api.ts                           # + waitlist, preview-aware submitProfile
  app/
    api/waitlist/route.ts
    api/checkout/founder/route.ts
    auth/callback/route.ts
    login/page.tsx
    waitlist/thanks/page.tsx
    founder/checkout/page.tsx
    founder/welcome/page.tsx
    wizard/unlock/page.tsx
    admin/leads/page.tsx
    admin/founders/page.tsx
  components/
    authenticated-shell.tsx
    founder-tier-card.tsx
    waitlist-form.tsx
    spots-remaining-badge.tsx
    blurred-score-bar.tsx
    paywall-panel.tsx
```

---

## Task 0: External setup (Stripe + Supabase)

**No code — required before Task 8+**

- [ ] **Step 1: Create Supabase project**

In Supabase dashboard:
1. New project → note `Project URL` and `anon` key
2. Authentication → Providers → Email → enable Email, disable confirm email for magic links (or enable and adjust copy)
3. Authentication → URL Configuration → set Site URL to production Vercel URL and `http://localhost:3000` for dev
4. Add redirect URL: `http://localhost:3000/auth/callback` and production `/auth/callback`
5. Settings → API → copy JWT Secret (`SUPABASE_JWT_SECRET`)

- [ ] **Step 2: Create Stripe Product + Price**

In Stripe Dashboard (test mode first):
1. Product: **Founder Access**
2. Price: **$19/month** recurring → copy Price ID (`price_...`)
3. Developers → Webhooks → add endpoint `https://<railway-api-host>/api/webhooks/stripe`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy webhook signing secret

- [ ] **Step 3: Populate env files**

`apps/web/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_FOUNDER_PRICE_ID=price_...
ADMIN_EMAILS=you@example.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`apps/api/.env`:

```text
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/grantfinder
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=local
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_JWT_SECRET=your-jwt-secret
ADMIN_EMAILS=you@example.com
```

Update `apps/web/.env.example` and document Railway/Vercel vars in README (Task 14).

---

## Task 1: Database migration — waitlist + subscription fields

**Files:**
- Modify: `apps/api/app/models.py`
- Create: `apps/api/app/migrations/versions/20260527_0002_founder_access.py`
- Test: `apps/api/tests/test_migrations_smoke.py` (optional import check)

- [ ] **Step 1: Extend models**

In `apps/api/app/models.py`, add after `User` class fields and new models:

```python
class WaitlistLead(TimestampMixin, Base):
    __tablename__ = "waitlist_leads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)


class StripeEvent(TimestampMixin, Base):
    __tablename__ = "stripe_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)  # Stripe event id


# Extend User with:
# first_name, supabase_user_id, stripe_customer_id, stripe_subscription_id,
# subscription_status (default "none"), founder_number, founder_locked_price (default "19.00"),
# subscribed_at
```

- [ ] **Step 2: Create Alembic migration**

Create `apps/api/app/migrations/versions/20260527_0002_founder_access.py` upgrading:
- `waitlist_leads` table
- `stripe_events` table
- new nullable columns on `users`
- unique indexes on `supabase_user_id`, `stripe_customer_id`, `stripe_subscription_id`, `founder_number`
- index on `users.subscription_status`

- [ ] **Step 3: Run migration locally**

```bash
cd apps/api
python3 -m alembic upgrade head
```

Expected: migration applies without error.

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/models.py apps/api/app/migrations/versions/20260527_0002_founder_access.py
git commit -m "feat: add waitlist and founder subscription schema"
```

---

## Task 2: Subscription service + cap logic

**Files:**
- Create: `apps/api/app/services/subscriptions.py`
- Modify: `apps/api/app/config.py`
- Test: `apps/api/tests/test_subscriptions.py`

- [ ] **Step 1: Write failing cap tests**

Create `apps/api/tests/test_subscriptions.py`:

```python
from app.services.subscriptions import FOUNDER_CAP, active_founder_count, spots_remaining


def test_founder_cap_constant():
    assert FOUNDER_CAP == 50


def test_spots_remaining_when_empty():
    assert spots_remaining(0) == 50


def test_spots_remaining_when_full():
    assert spots_remaining(50) == 0
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/api
python3 -m pytest tests/test_subscriptions.py -v
```

- [ ] **Step 3: Implement subscriptions service**

Create `apps/api/app/services/subscriptions.py`:

```python
FOUNDER_CAP = 50
ACTIVE_STATUSES = {"active", "past_due"}


def active_founder_count(db) -> int:
    from sqlalchemy import func, select
    from app.models import User

    return db.scalar(
        select(func.count())
        .select_from(User)
        .where(User.subscription_status.in_(ACTIVE_STATUSES))
        .where(User.founder_number.is_not(None))
    ) or 0


def spots_remaining(active_count: int) -> int:
    return max(0, FOUNDER_CAP - active_count)


def cap_reached(active_count: int) -> bool:
    return active_count >= FOUNDER_CAP
```

Extend `Settings` in `config.py`:

```python
stripe_webhook_secret: str = ""
supabase_jwt_secret: str = ""
admin_emails: str = ""
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/api
python3 -m pytest tests/test_subscriptions.py -v
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services/subscriptions.py apps/api/app/config.py apps/api/tests/test_subscriptions.py
git commit -m "feat: add founder cap helpers and billing settings"
```

---

## Task 3: Waitlist API

**Files:**
- Modify: `apps/api/app/schemas.py`
- Create: `apps/api/app/api/waitlist.py`
- Modify: `apps/api/app/main.py` or `routes.py` to include router
- Test: `apps/api/tests/test_waitlist.py`

- [ ] **Step 1: Write failing waitlist test**

Create `apps/api/tests/test_waitlist.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_waitlist_create_returns_201():
    response = client.post(
        "/api/waitlist",
        json={"email": "founder@example.com", "first_name": "Alex", "source": "landing_hero"},
    )
    assert response.status_code == 201
    assert response.json()["email"] == "founder@example.com"


def test_waitlist_duplicate_is_idempotent():
    payload = {"email": "dup@example.com", "first_name": "Sam", "source": "paywall"}
    first = client.post("/api/waitlist", json=payload)
    second = client.post("/api/waitlist", json=payload)
    assert first.status_code == 201
    assert second.status_code == 200
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/api
python3 -m pytest tests/test_waitlist.py -v
```

- [ ] **Step 3: Add schema + route**

In `schemas.py`:

```python
class WaitlistInput(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    source: str = Field(pattern=r"^(landing_hero|landing_footer|paywall|founder_page)$")
```

Create `apps/api/app/api/waitlist.py`:

```python
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import WaitlistLead
from app.schemas import WaitlistInput

router = APIRouter(prefix="/api")


@router.post("/waitlist", status_code=status.HTTP_201_CREATED)
def create_waitlist_lead(payload: WaitlistInput, response: Response, db: Session = Depends(get_db)):
    email = payload.email.lower()
    existing = db.scalar(select(WaitlistLead).where(WaitlistLead.email == email))
    if existing:
        response.status_code = status.HTTP_200_OK
        return {"email": existing.email, "first_name": existing.first_name, "source": existing.source}
    lead = WaitlistLead(email=email, first_name=payload.first_name.strip(), source=payload.source)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return {"email": lead.email, "first_name": lead.first_name, "source": lead.source}
```

Register in `main.py`:

```python
from app.api.waitlist import router as waitlist_router
app.include_router(waitlist_router)
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: add waitlist lead capture API"
```

---

## Task 4: Supabase JWT auth dependency

**Files:**
- Create: `apps/api/app/auth.py`
- Modify: `apps/api/pyproject.toml` (add `pyjwt>=2.8.0`)
- Test: `apps/api/tests/test_auth.py`

- [ ] **Step 1: Add PyJWT dependency**

In `apps/api/pyproject.toml`:

```toml
"pyjwt>=2.8.0",
```

Run `pip install -e .` in `apps/api`.

- [ ] **Step 2: Write failing auth test**

Create `apps/api/tests/test_auth.py` with a helper that decodes a test JWT signed with `SUPABASE_JWT_SECRET` and asserts `get_current_user_email` returns the email claim.

- [ ] **Step 3: Implement `app/auth.py`**

```python
import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User

settings = get_settings()


def _decode_supabase_token(authorization: str | None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        return jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    claims = _decode_supabase_token(authorization)
    email = (claims.get("email") or "").lower()
    supabase_user_id = claims.get("sub")
    if not email or not supabase_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid claims")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, supabase_user_id=supabase_user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.supabase_user_id != supabase_user_id:
        user.supabase_user_id = supabase_user_id
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    admins = {e.strip().lower() for e in settings.admin_emails.split(",") if e.strip()}
    if user.email.lower() not in admins:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user
```

- [ ] **Step 4: Run auth tests — expect PASS**

- [ ] **Step 5: Commit**

---

## Task 5: Profile submit gating (preview vs full dashboard)

**Files:**
- Modify: `apps/api/app/api/routes.py`
- Modify: `apps/api/app/schemas.py`
- Test: `apps/api/tests/test_profile_gating.py`

- [ ] **Step 1: Write failing gating tests**

```python
def test_profile_submit_without_auth_returns_preview(client):
    response = client.post("/api/profiles", json=VALID_PROFILE)
    body = response.json()
    assert body["preview"] is True
    assert "categories" in body
    assert "matches" not in body


def test_profile_submit_with_active_subscription_returns_full_dashboard(client, active_user_token):
    response = client.post(
        "/api/profiles",
        json=VALID_PROFILE,
        headers={"Authorization": f"Bearer {active_user_token}"},
    )
    body = response.json()
    assert body.get("preview") is not True
    assert "matches" in body
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement preview builder**

Add helper in `routes.py`:

```python
from app.services.subscriptions import active_founder_count, spots_remaining
from app.auth import get_current_user_optional  # new optional dependency


def build_preview_response(user, readiness: dict, db: Session) -> dict:
    categories = []
    for key, value in readiness.items():
        if key == "missing_paperwork":
            continue
        categories.append({"key": key, "label": value["label"], "reason": value["reason"]})
    count = active_founder_count(db)
    return {
        "preview": True,
        "user": {"id": user.id, "email": user.email},
        "categories": categories,
        "spots_remaining": spots_remaining(count),
        "cap_reached": count >= 50,
    }
```

Change `submit_profile` signature to accept optional `Authorization` header:
- Always persist profile (existing logic)
- If `user.subscription_status != "active"` → return preview
- Else → return full dashboard (existing return shape)

Add optional auth dependency that returns `None` when no token.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

---

## Task 6: Stripe webhook + subscription endpoints

**Files:**
- Create: `apps/api/app/services/stripe_webhooks.py`
- Create: `apps/api/app/api/billing.py`
- Modify: `apps/api/pyproject.toml` (add `stripe>=10.0.0`)
- Test: `apps/api/tests/test_stripe_webhook.py`

- [ ] **Step 1: Write failing webhook test**

Use Stripe fixture JSON for `checkout.session.completed` with mocked signature verification.

- [ ] **Step 2: Implement webhook handler**

`POST /api/webhooks/stripe`:
- Read raw body
- `stripe.Webhook.construct_event(payload, sig, secret)`
- Idempotency: skip if `StripeEvent` id exists
- On `checkout.session.completed`:
  - Load user by `client_reference_id`
  - Set `stripe_customer_id`, `stripe_subscription_id`, `subscription_status="active"`, `subscribed_at=now()`
  - In transaction with `SELECT ... FOR UPDATE` on users table: assign next `founder_number` if under cap; else mark for manual review / refund (log error)

`GET /api/me/subscription` (auth required):

```python
return {
    "status": user.subscription_status,
    "founder_number": user.founder_number,
    "spots_remaining": spots_remaining(active_founder_count(db)),
    "email": user.email,
}
```

`GET /api/billing/cap` (public):

```python
count = active_founder_count(db)
return {"active_founders": count, "spots_remaining": spots_remaining(count), "cap_reached": cap_reached(count)}
```

- [ ] **Step 3: Run webhook tests — expect PASS**

- [ ] **Step 4: Commit**

---

## Task 7: Admin leads + founders export

**Files:**
- Create: `apps/api/app/api/admin_billing.py`
- Test: extend `apps/api/tests/test_waitlist.py` or new admin test file

- [ ] **Step 1: Implement routes**

`GET /api/admin/leads` — `require_admin`, returns JSON list; `?format=csv` returns `text/csv` attachment.

`GET /api/admin/founders` — returns `{ "seat_count": N, "cap": 50, "founders": [...] }`.

- [ ] **Step 2: Manual smoke test**

```bash
curl -H "Authorization: Bearer $ADMIN_JWT" http://localhost:8000/api/admin/leads
```

- [ ] **Step 3: Commit**

---

## Task 8: Frontend dependencies + Supabase clients

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- Create: `apps/web/middleware.ts`
- Modify: `apps/web/.env.example`

- [ ] **Step 1: Install packages**

```bash
cd apps/web
npm install @supabase/supabase-js @supabase/ssr stripe
```

- [ ] **Step 2: Add Supabase browser client**

`lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Add Supabase server client**

Follow `@supabase/ssr` Next.js App Router cookie pattern in `lib/supabase/server.ts`.

- [ ] **Step 4: Add root middleware**

`middleware.ts` at `apps/web/middleware.ts`:
- Refresh Supabase session on each request
- For paths `/dashboard`, `/funding`, `/tasks`: require session; call backend `GET /api/me/subscription` with access token; redirect to `/founder/checkout` if not `active`
- For paths `/admin/leads`, `/admin/founders`, `/admin/sources`: require admin email match

Matcher config:

```typescript
export const config = {
  matcher: ["/dashboard/:path*", "/funding/:path*", "/tasks/:path*", "/admin/:path*"],
};
```

- [ ] **Step 5: Run typecheck**

```bash
cd apps/web
npm run typecheck
```

- [ ] **Step 6: Commit**

---

## Task 9: Next.js API routes — waitlist + checkout

**Files:**
- Create: `apps/web/app/api/waitlist/route.ts`
- Create: `apps/web/app/api/checkout/founder/route.ts`
- Create: `apps/web/lib/stripe.ts`

- [ ] **Step 1: Waitlist proxy route**

`POST /api/waitlist` forwards to FastAPI `/api/waitlist`.

- [ ] **Step 2: Founder checkout route**

`POST /api/checkout/founder`:
1. Parse `{ email, userId }` from body
2. `GET ${API}/api/billing/cap` — if `cap_reached`, return 409
3. Create Stripe Checkout session:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer_email: email,
  client_reference_id: userId,
  line_items: [{ price: process.env.STRIPE_FOUNDER_PRICE_ID!, quantity: 1 }],
  success_url: `${siteUrl}/founder/welcome?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${siteUrl}/founder/checkout?canceled=1`,
});
return NextResponse.json({ url: session.url });
```

- [ ] **Step 3: Commit**

---

## Task 10: Landing page — dual tier + spots counter

**Files:**
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/components/waitlist-form.tsx`
- Create: `apps/web/components/founder-tier-card.tsx`
- Create: `apps/web/components/spots-remaining-badge.tsx`
- Modify: `apps/web/components/app-shell.tsx` (header CTAs)

- [ ] **Step 1: Build WaitlistForm client component**

Props: `source: "landing_hero" | "landing_footer"`. POST to `/api/waitlist`. On success → `/waitlist/thanks`.

- [ ] **Step 2: Build FounderTierCard**

Shows `$19/mo`, strikethrough `$49/mo`, `SpotsRemainingBadge`, CTA → `/founder/checkout` or `/wizard`.

- [ ] **Step 3: Fetch cap on landing**

Server component fetches `${API}/api/billing/cap` with `cache: "no-store"` and passes `spotsRemaining` to cards.

- [ ] **Step 4: Restructure landing per Figma `01 Landing` page**

Match sections from design file: hero + tier row, feature grid, how-it-works, forms row, footer waitlist. Keep existing CSS variables.

- [ ] **Step 5: Update AppShell nav**

Add **Log in** → `/login`, **Become a Founder** → `/founder/checkout`.

- [ ] **Step 6: Visual check against Figma**

Open https://www.figma.com/design/z7GTV3blc0MVceWDkud46Y node `01 Landing`.

- [ ] **Step 7: Commit**

---

## Task 11: Wizard flow — draft save + paywall redirect

**Files:**
- Modify: `apps/web/components/wizard-form.tsx`
- Modify: `apps/web/lib/types.ts`, `apps/web/lib/api.ts`
- Create: `apps/web/app/wizard/unlock/page.tsx`
- Create: `apps/web/components/blurred-score-bar.tsx`
- Create: `apps/web/components/paywall-panel.tsx`

- [ ] **Step 1: Extend types for preview response**

```typescript
export interface PreviewDashboardPayload {
  preview: true;
  user: { id: string; email: string };
  categories: Array<{ key: string; label: string; reason: string }>;
  spots_remaining: number;
  cap_reached: boolean;
}
```

- [ ] **Step 2: Update wizard submit handler**

On submit:
1. POST profile to API (no auth header for anonymous users)
2. If response has `preview: true`:
   - Store `{ userId, categories, spots_remaining, cap_reached }` in `sessionStorage` key `smbfn_unlock_preview`
   - `router.push("/wizard/unlock")`
3. If full dashboard: keep existing `localStorage smbfn_user_id` + `/dashboard`

Add `localStorage` draft save on each step change (`smbfn_wizard_draft`).

- [ ] **Step 3: Build `/wizard/unlock` page**

Read preview from `sessionStorage`. Render 6 `BlurredScoreBar` components (label visible, score shows `??` with blur CSS). `PaywallPanel` CTAs:
- **Unlock for $19/mo** → POST `/api/checkout/founder`
- **Join free waitlist** → inline form
- **Edit answers** → `/wizard`

Sold-out state when `cap_reached`.

- [ ] **Step 4: Commit**

---

## Task 12: Auth + founder flow pages

**Files:**
- Create: `apps/web/app/login/page.tsx`
- Create: `apps/web/app/auth/callback/route.ts`
- Create: `apps/web/app/waitlist/thanks/page.tsx`
- Create: `apps/web/app/founder/checkout/page.tsx`
- Create: `apps/web/app/founder/welcome/page.tsx`

- [ ] **Step 1: Login page**

Email input → `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${siteUrl}/auth/callback` } })`.

- [ ] **Step 2: Auth callback route**

Exchange code for session using `@supabase/ssr` server client; redirect to `/dashboard` if subscription active, else `/founder/checkout`.

- [ ] **Step 3: Founder checkout page**

Standalone pitch + spots counter + Stripe CTA. Handle `?canceled=1` message.

- [ ] **Step 4: Founder welcome page**

Read `session_id` query param. Poll `GET /api/me/subscription` every 2s up to 15 attempts. Show:
- Success: “Check your email for a magic link”
- Timeout: “Payment processing — refresh in a minute”

Trigger magic link send via Supabase if session exists.

- [ ] **Step 5: Waitlist thanks page**

Confirmation + link to `/wizard`.

- [ ] **Step 6: Commit**

---

## Task 13: Authenticated shell + dashboard refresh

**Files:**
- Create: `apps/web/components/authenticated-shell.tsx`
- Modify: `apps/web/app/dashboard/page.tsx`, `funding/page.tsx`, `tasks/page.tsx`

- [ ] **Step 1: Build AuthenticatedShell**

Sidebar nav per Figma dashboard mockup (Dashboard, Funding, Paperwork, Tasks). Header: welcome + business name from profile.

- [ ] **Step 2: Switch gated pages to AuthenticatedShell**

Replace `AppShell` on dashboard/funding/tasks. Load dashboard via authenticated API using Supabase session token in `Authorization` header (extend `lib/api.ts` with `createAuthedRequest(getToken)`).

- [ ] **Step 3: Remove localStorage-only auth**

Dashboard should use Supabase session + backend user id from profile submit or `/me/subscription`.

- [ ] **Step 4: Commit**

---

## Task 14: Admin pages + deployment docs

**Files:**
- Create: `apps/web/app/admin/leads/page.tsx`
- Create: `apps/web/app/admin/founders/page.tsx`
- Modify: `README.md`, `apps/web/.env.example`

- [ ] **Step 1: Admin leads page**

Fetch `/api/admin/leads?format=csv` download button + table view.

- [ ] **Step 2: Admin founders page**

Show seat count `37/50` and founder table.

- [ ] **Step 3: Update README**

Add Founder Access env vars, Stripe webhook setup, Supabase redirect URLs, launch verification checklist from spec.

- [ ] **Step 4: Commit**

---

## Task 15: End-to-end launch verification

- [ ] **Step 1: Backend tests green**

```bash
cd apps/api
python3 -m pytest -v
```

Expected: all tests PASS.

- [ ] **Step 2: Frontend build green**

```bash
cd apps/web
npm run typecheck
npm run build
```

- [ ] **Step 3: Manual funnel (Stripe test mode)**

1. Submit waitlist on landing → row in DB
2. Complete wizard anonymously → blurred paywall
3. Checkout with `4242` card → webhook → `founder_number` assigned
4. Magic link login → full dashboard
5. Seed 50 active founders in staging DB → checkout returns 409

- [ ] **Step 4: Deploy**

Railway: set new env vars, run migration via pre-deploy.  
Vercel: set Supabase + Stripe env vars.  
Stripe: switch webhook to production URL when ready.

- [ ] **Step 5: Post launch**

Share landing URL. Monitor Stripe webhook logs and `/admin/leads`.

---

## Plan self-review

| Spec requirement | Task |
|---|---|
| Free waitlist (email + first name) | Task 3, 9, 10 |
| Stripe $19/mo Checkout | Task 0, 6, 9, 12 |
| Magic link auth | Task 0, 4, 8, 12 |
| Wizard hook + blurred paywall | Task 5, 11 |
| 50-seat hard cap | Task 2, 6, 9, 11 |
| Route gating | Task 8 |
| Admin leads/founders | Task 7, 14 |
| Landing dual-tier | Task 10 |
| Authenticated dashboard shell | Task 13 |
| Env + deploy docs | Task 0, 14, 15 |

No TBD placeholders remain. Phase 2 items (wizard live preview, full admin CMS) intentionally excluded.

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-27-founder-access-mvp.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — implement tasks in this session using executing-plans, batch execution with checkpoints

Which approach do you want?
