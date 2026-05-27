# SMB Funding Navigator

SMB Funding Navigator is a Maryland-first MVP for helping small businesses, startups, solo founders, new LLC owners, and contractors understand likely funding paths, paperwork, and readiness steps.

It is not a grant scraper and does not auto-submit forms. It provides educational guidance only and is not legal, tax, or financial advice.

## Monorepo Layout

```text
apps/api   FastAPI backend for Railway and PostgreSQL
apps/web   Next.js frontend for Vercel
docs       Approved design specs and implementation plans
```

## Local Prerequisites

- Python 3.11+
- Node.js 20+
- npm
- PostgreSQL for full persistence testing

The backend can serve seeded fallback data without Postgres, but Railway deployment should use PostgreSQL through `DATABASE_URL`.

## Backend Setup

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python3 -m pytest -v
python3 -m uvicorn app.main:app --reload --port 8000
```

With PostgreSQL running:

```bash
cd apps/api
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/grantfinder"
python3 -m alembic upgrade head
python3 -m app.seed
```

Health check:

```bash
curl http://localhost:8000/health
```

## Frontend Setup

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Frontend on Vercel:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-railway-api-url
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_FOUNDER_PRICE_ID=price_...
ADMIN_EMAILS=you@example.com
```

Backend on Railway:

```text
DATABASE_URL=postgresql+psycopg://...
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:3000
ENVIRONMENT=production
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_JWT_SECRET=your-jwt-secret
ADMIN_EMAILS=you@example.com
```

## Founder Access MVP

Founder Access adds a dual-tier landing page, Stripe Checkout ($19/mo), Supabase magic-link auth, wizard paywall with blurred preview, 50-seat cap, and gated dashboard routes.

### Supabase setup

1. Create a Supabase project and enable Email auth (magic links).
2. Authentication → URL Configuration:
   - Site URL: production Vercel URL and `http://localhost:3000` for local dev
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`
3. Copy Project URL, anon key, and JWT secret (`SUPABASE_JWT_SECRET` on Railway).

### Stripe setup

1. Create a **Founder Access** product with a **$19/month** recurring price.
2. Add webhook endpoint: `https://<railway-api-host>/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook signing secret and price ID into env vars.

### Launch verification checklist

1. Submit waitlist on landing → lead appears in `/admin/leads`
2. Complete wizard anonymously → blurred paywall at `/wizard/unlock`
3. Checkout with Stripe test card `4242 4242 4242 4242` → webhook assigns `founder_number`
4. Magic link login → full dashboard at `/dashboard`
5. With 50 active founders in DB → checkout returns 409 (sold out)

## Railway Deployment

1. Create a Railway project.
2. Add a PostgreSQL service.
3. Add the backend service from this repository.
4. Set the backend root directory to `/apps/api`.
5. Set the Railway config file path to `/apps/api/railway.json`.
6. Set `DATABASE_URL`, `CORS_ORIGINS`, and `ENVIRONMENT`.
7. Deploy. The backend `railway.json` runs migrations and seed data through the pre-deploy command.
8. Confirm `GET /health` returns `{"status":"ok"}`.

The backend start command is pinned in `apps/api/railway.json` because the FastAPI app lives at `app.main:app`, while Railpack's default FastAPI detection expects a root-level `main:app`.

## Vercel Deployment

1. Import the repository in Vercel.
2. Set the root directory to `apps/web`.
3. Set `NEXT_PUBLIC_API_BASE_URL` to the Railway backend URL.
4. Deploy.
5. Confirm the landing page loads and the wizard can submit a profile.

## MVP Verification Flow

1. Start the backend on port `8000`.
2. Start the frontend on port `3000`.
3. Open `/`.
4. Complete `/wizard`.
5. Confirm `/dashboard` shows six readiness scores.
6. Open `/funding` and a program detail page.
7. Open `/paperwork` and a document detail page.
8. Mark a task complete on `/tasks`.
9. Open `/admin/sources`.

## Safety Rules

- Do not claim guaranteed eligibility.
- Use language like "may qualify," "likely relevant," and "needs review."
- Always link to official sources.
- Do not auto-submit government forms.
- Keep disclaimers visible on guidance pages.

## Future Roadmap

- Role-based admin access beyond email allowlist
- Admin editing for sources, programs, documents, and matching rules
- Scraper/indexer jobs for Maryland state, county, SAM.gov, IRS, SBA, utility, and workforce sources
- AI document ingestion for PDFs and long source pages
- Deadline and eligibility extraction
- Notifications and saved search alerts
- Multi-business profiles per user
- Payments and SaaS plan management
