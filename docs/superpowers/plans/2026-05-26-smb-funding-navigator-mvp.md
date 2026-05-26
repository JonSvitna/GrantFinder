# SMB Funding Navigator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deployment-first SMB Funding Navigator MVP with a Next.js frontend, FastAPI backend, PostgreSQL persistence, seeded Maryland-first data, profile wizard, readiness dashboard, funding matches, paperwork navigator, saved tasks, and deployment documentation.

**Architecture:** Use a two-app monorepo: `apps/web` for the Vercel-hosted Next.js UI and `apps/api` for the Railway-hosted FastAPI service. The backend owns data persistence, matching, readiness scoring, task generation, and seed data. The frontend calls the backend through a small typed API client and keeps user identity as an email-only `userId` stored in browser local storage after wizard submission.

**Tech Stack:** Next.js, React, TypeScript, TailwindCSS, FastAPI, SQLAlchemy, Alembic, Pydantic, PostgreSQL, pytest.

---

## File Structure

Create this structure:

```text
apps/
  api/
    alembic.ini
    pyproject.toml
    README.md
    app/
      __init__.py
      main.py
      config.py
      database.py
      errors.py
      models.py
      schemas.py
      seed.py
      api/
        __init__.py
        routes.py
      services/
        __init__.py
        ai.py
        matching.py
        readiness.py
        tasks.py
    tests/
      test_matching.py
      test_readiness.py
      test_api_smoke.py
  web/
    .env.example
    next.config.ts
    package.json
    postcss.config.mjs
    tailwind.config.ts
    tsconfig.json
    app/
      globals.css
      layout.tsx
      page.tsx
      wizard/page.tsx
      dashboard/page.tsx
      funding/page.tsx
      funding/[programId]/page.tsx
      paperwork/page.tsx
      paperwork/[documentId]/page.tsx
      tasks/page.tsx
      admin/sources/page.tsx
    components/
      app-shell.tsx
      cards.tsx
      disclaimer.tsx
      score-bar.tsx
      wizard-form.tsx
    lib/
      api.ts
      types.ts
README.md
```

## Task 1: Backend Scaffold and Health Check

**Files:**
- Create: `apps/api/pyproject.toml`
- Create: `apps/api/app/__init__.py`
- Create: `apps/api/app/config.py`
- Create: `apps/api/app/database.py`
- Create: `apps/api/app/main.py`
- Create: `apps/api/app/errors.py`
- Create: `apps/api/tests/test_api_smoke.py`

- [ ] **Step 1: Write the failing health test**

Create `apps/api/tests/test_api_smoke.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_status_ok():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_api_smoke.py -v
```

Expected: FAIL because `app.main` does not exist.

- [ ] **Step 3: Add backend package configuration**

Create `apps/api/pyproject.toml`:

```toml
[project]
name = "smb-funding-navigator-api"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "alembic>=1.13.0",
  "fastapi>=0.111.0",
  "psycopg[binary]>=3.1.0",
  "pydantic-settings>=2.2.0",
  "pytest>=8.2.0",
  "sqlalchemy>=2.0.0",
  "uvicorn[standard]>=0.29.0"
]

[tool.pytest.ini_options]
pythonpath = ["."]
```

Create `apps/api/app/__init__.py` as an empty file.

- [ ] **Step 4: Add config, database, errors, and app entrypoint**

Create `apps/api/app/config.py`:

```python
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/grantfinder"
    cors_origins: str = "http://localhost:3000"
    environment: str = "local"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

Create `apps/api/app/database.py`:

```python
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


engine = create_engine(get_settings().database_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Create `apps/api/app/errors.py`:

```python
from fastapi import HTTPException


def not_found(message: str) -> HTTPException:
    return HTTPException(status_code=404, detail={"message": message, "code": "NOT_FOUND", "field_errors": {}})
```

Create `apps/api/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


settings = get_settings()
app = FastAPI(title="SMB Funding Navigator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
```

- [ ] **Step 5: Run health test to verify it passes**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_api_smoke.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api
git commit -m "feat: scaffold FastAPI backend"
```

## Task 2: Backend Models and Seed Data

**Files:**
- Create: `apps/api/app/models.py`
- Create: `apps/api/app/seed.py`
- Modify: `apps/api/tests/test_api_smoke.py`

- [ ] **Step 1: Write failing seed/model test**

Append to `apps/api/tests/test_api_smoke.py`:

```python
from app.seed import DOCUMENT_SEEDS, PROGRAM_SEEDS, SOURCE_SEEDS


def test_seed_data_contains_required_mvp_records():
    assert len(SOURCE_SEEDS) >= 10
    assert len(PROGRAM_SEEDS) >= 10
    assert len(DOCUMENT_SEEDS) >= 13
    assert any(program["name"] == "SBA Microloan" for program in PROGRAM_SEEDS)
    assert any(document["name"] == "IRS W-9" for document in DOCUMENT_SEEDS)
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_api_smoke.py::test_seed_data_contains_required_mvp_records -v
```

Expected: FAIL because `app.seed` does not exist.

- [ ] **Step 3: Add SQLAlchemy models**

Create `apps/api/app/models.py` with models for `User`, `BusinessProfile`, `Source`, `Program`, `Document`, `MatchResult`, `Task`, and `SavedItem`. Use SQLAlchemy 2.0 mapped columns, JSON columns for list-like values, and string primary keys generated by `uuid.uuid4`.

Required relationships:

- `BusinessProfile.user_id` references `users.id`
- `Program.source_id` references `sources.id`
- `Document.source_id` references `sources.id`
- `MatchResult.profile_id` references `business_profiles.id`
- `MatchResult.program_id` references `programs.id`
- `Task.user_id` references `users.id`
- `SavedItem.user_id` references `users.id`

- [ ] **Step 4: Add deterministic seed data constants**

Create `apps/api/app/seed.py` with `SOURCE_SEEDS`, `PROGRAM_SEEDS`, and `DOCUMENT_SEEDS`. Include the required Maryland-first records from the design spec. Use real official URLs where stable, including:

```python
"https://businessexpress.maryland.gov/"
"https://commerce.maryland.gov/fund"
"https://emma.maryland.gov/"
"https://sam.gov/content/entity-registration"
"https://www.irs.gov/forms-pubs/about-form-w-9"
"https://www.sba.gov/funding-programs/loans/microloans"
```

Also add a `seed_database(db)` function that upserts sources, programs, and documents by name.

- [ ] **Step 5: Run seed test to verify it passes**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_api_smoke.py::test_seed_data_contains_required_mvp_records -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/models.py apps/api/app/seed.py apps/api/tests/test_api_smoke.py
git commit -m "feat: add backend data model and seeds"
```

## Task 3: Matching, Readiness, and Task Services

**Files:**
- Create: `apps/api/app/services/matching.py`
- Create: `apps/api/app/services/readiness.py`
- Create: `apps/api/app/services/tasks.py`
- Create: `apps/api/app/services/__init__.py`
- Create: `apps/api/tests/test_matching.py`
- Create: `apps/api/tests/test_readiness.py`

- [ ] **Step 1: Write failing matching tests**

Create `apps/api/tests/test_matching.py`:

```python
from app.seed import PROGRAM_SEEDS
from app.services.matching import generate_matches


def test_procurement_profile_gets_sam_and_emma_matches():
    profile = {
        "funding_needs": ["government contracting"],
        "interested_in_government_contracts": True,
        "has_sam_registration": False,
        "has_emma_account": False,
        "ownership_statuses": [],
        "location_type": "urban",
        "hiring_plans": False,
    }

    matches = generate_matches(profile, PROGRAM_SEEDS)
    names = [match["program"]["name"] for match in matches]

    assert "SAM.gov Entity Registration" in names
    assert "eMMA Vendor Registration" in names
    assert matches[0]["score"] >= matches[-1]["score"]
```

- [ ] **Step 2: Write failing readiness tests**

Create `apps/api/tests/test_readiness.py`:

```python
from app.services.readiness import calculate_readiness
from app.services.tasks import generate_tasks


def test_readiness_scores_penalize_missing_procurement_documents():
    profile = {
        "has_ein": True,
        "has_business_bank_account": True,
        "has_w9": False,
        "has_sam_registration": False,
        "has_emma_account": False,
        "interested_in_government_contracts": True,
        "funding_needs": ["government contracting"],
    }

    readiness = calculate_readiness(profile)

    assert readiness["paperwork"]["score"] < 100
    assert readiness["sam_gov"]["score"] < 50
    assert readiness["emma"]["score"] < 50
    assert "Complete IRS W-9" in readiness["missing_paperwork"]


def test_task_generation_creates_priority_actions():
    profile = {
        "has_ein": False,
        "has_business_bank_account": False,
        "has_w9": False,
        "has_sam_registration": False,
        "has_emma_account": False,
        "interested_in_government_contracts": True,
        "funding_needs": ["startup capital", "government contracting"],
    }

    tasks = generate_tasks(profile)
    titles = [task["title"] for task in tasks]

    assert "Apply for an EIN" in titles
    assert "Complete IRS W-9" in titles
    assert "Start SAM.gov registration" in titles
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_matching.py tests/test_readiness.py -v
```

Expected: FAIL because service modules do not exist.

- [ ] **Step 4: Implement matching service**

Create `apps/api/app/services/__init__.py` as an empty file.

Create `apps/api/app/services/matching.py`:

```python
def generate_matches(profile: dict, programs: list[dict]) -> list[dict]:
    matches = []
    needs = set(profile.get("funding_needs") or [])
    ownership = set(profile.get("ownership_statuses") or [])

    for program in programs:
        score = 20
        reasons = []
        category = program.get("category", "")
        name = program.get("name", "")

        if category in needs or program.get("funding_type") in needs:
            score += 35
            reasons.append(f"Matches your need for {category}.")
        if profile.get("interested_in_government_contracts") and category in {"procurement", "government contracting"}:
            score += 35
            reasons.append("Supports government contracting readiness.")
        if not profile.get("has_sam_registration") and "SAM.gov" in name:
            score += 30
            reasons.append("SAM.gov is missing from your readiness checklist.")
        if not profile.get("has_emma_account") and "eMMA" in name:
            score += 30
            reasons.append("eMMA is missing from your readiness checklist.")
        if profile.get("hiring_plans") and category in {"workforce", "training"}:
            score += 25
            reasons.append("Hiring or training plans may fit workforce incentives.")
        if ownership and category in {"certification", "minority-owned", "women-owned", "veteran-owned"}:
            score += 25
            reasons.append("Ownership status may fit certification support.")
        if profile.get("location_type") == "rural" and category == "rural":
            score += 25
            reasons.append("Rural location may open additional programs.")

        matches.append({
            "program": program,
            "score": min(score, 100),
            "confidence": "high" if score >= 75 else "medium" if score >= 50 else "needs review",
            "fit_reason": " ".join(reasons) or program.get("best_fit", "May fit based on your business profile."),
            "next_action": program.get("next_action", "Review the official source and confirm eligibility."),
        })

    return sorted(matches, key=lambda item: item["score"], reverse=True)
```

- [ ] **Step 5: Implement readiness and task services**

Create `apps/api/app/services/readiness.py`:

```python
def calculate_readiness(profile: dict) -> dict:
    missing = []
    paperwork_score = 100

    checks = [
        ("has_ein", "Apply for an EIN"),
        ("has_business_bank_account", "Open a business bank account"),
        ("has_w9", "Complete IRS W-9"),
    ]
    for field, label in checks:
        if not profile.get(field):
            paperwork_score -= 25
            missing.append(label)

    procurement_interest = bool(profile.get("interested_in_government_contracts"))
    sam_score = 100 if profile.get("has_sam_registration") else 35 if procurement_interest else 70
    emma_score = 100 if profile.get("has_emma_account") else 35 if procurement_interest else 70
    procurement_score = min(100, int((sam_score + emma_score + (100 if profile.get("has_w9") else 40)) / 3))
    funding_score = max(35, paperwork_score - (10 if not profile.get("funding_needs") else 0))
    grant_score = max(30, int((paperwork_score + funding_score) / 2))

    return {
        "funding": {"label": "Funding Readiness", "score": funding_score},
        "procurement": {"label": "Procurement Readiness", "score": procurement_score},
        "paperwork": {"label": "Paperwork Readiness", "score": max(paperwork_score, 0)},
        "grant": {"label": "Grant Readiness", "score": grant_score},
        "sam_gov": {"label": "SAM.gov Readiness", "score": sam_score},
        "emma": {"label": "eMMA Readiness", "score": emma_score},
        "missing_paperwork": missing,
    }
```

Create `apps/api/app/services/tasks.py`:

```python
def generate_tasks(profile: dict) -> list[dict]:
    tasks = []

    def add(title: str, description: str, category: str, priority: str = "high") -> None:
        tasks.append({
            "title": title,
            "description": description,
            "category": category,
            "priority": priority,
            "status": "open",
        })

    if not profile.get("has_ein"):
        add("Apply for an EIN", "Get an Employer Identification Number from the IRS before opening accounts or completing many forms.", "paperwork")
    if not profile.get("has_business_bank_account"):
        add("Open a business bank account", "Separate business and personal finances before applying for funding.", "paperwork")
    if not profile.get("has_w9"):
        add("Complete IRS W-9", "Prepare a W-9 so agencies, primes, and customers can request taxpayer information.", "paperwork")
    if profile.get("interested_in_government_contracts") and not profile.get("has_sam_registration"):
        add("Start SAM.gov registration", "Create or update your federal entity registration and get ready for federal opportunities.", "procurement")
    if profile.get("interested_in_government_contracts") and not profile.get("has_emma_account"):
        add("Create an eMMA vendor account", "Register with Maryland's procurement portal to monitor state opportunities.", "procurement")

    return tasks
```

- [ ] **Step 6: Run tests to verify they pass**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_matching.py tests/test_readiness.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/services apps/api/tests/test_matching.py apps/api/tests/test_readiness.py
git commit -m "feat: add matching and readiness services"
```

## Task 4: Backend API Routes

**Files:**
- Create: `apps/api/app/schemas.py`
- Create: `apps/api/app/api/__init__.py`
- Create: `apps/api/app/api/routes.py`
- Modify: `apps/api/app/main.py`
- Modify: `apps/api/tests/test_api_smoke.py`

- [ ] **Step 1: Write failing API smoke tests**

Append to `apps/api/tests/test_api_smoke.py`:

```python
def test_programs_and_documents_list_endpoints_return_seeded_data():
    client = TestClient(app)

    programs = client.get("/api/programs")
    documents = client.get("/api/documents")

    assert programs.status_code == 200
    assert documents.status_code == 200
    assert len(programs.json()) >= 10
    assert len(documents.json()) >= 13


def test_profile_submission_returns_dashboard_payload():
    client = TestClient(app)
    payload = {
        "email": "owner@example.com",
        "business_name": "Harbor Test LLC",
        "county": "Baltimore County",
        "stage": "startup",
        "industry": "professional services",
        "entity_type": "LLC",
        "revenue_range": "pre-revenue",
        "employee_count": 1,
        "hiring_plans": False,
        "funding_needs": ["startup capital", "government contracting"],
        "has_ein": False,
        "has_business_bank_account": False,
        "has_w9": False,
        "has_sam_registration": False,
        "has_emma_account": False,
        "interested_in_government_contracts": True,
        "ownership_statuses": [],
        "location_type": "urban"
    }

    response = client.post("/api/profiles", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == "owner@example.com"
    assert "readiness" in body
    assert len(body["matches"]) > 0
    assert len(body["tasks"]) > 0
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_api_smoke.py -v
```

Expected: FAIL because API routes are not wired.

- [ ] **Step 3: Add Pydantic schemas**

Create `apps/api/app/schemas.py` with `ProfileInput`, `SavedItemInput`, and `TaskUpdateInput`. `ProfileInput` must include every wizard field listed in the spec.

- [ ] **Step 4: Add API routes using seed-backed in-memory behavior for tests**

Create `apps/api/app/api/__init__.py` as an empty file.

Create `apps/api/app/api/routes.py`. Implement:

- `GET /api/programs`
- `GET /api/programs/{program_id}`
- `GET /api/documents`
- `GET /api/documents/{document_id}`
- `POST /api/profiles`
- `GET /api/profiles/{user_id}/dashboard`
- `GET /api/profiles/{user_id}/matches`
- `POST /api/saved-items`
- `DELETE /api/saved-items/{saved_item_id}`
- `PATCH /api/tasks/{task_id}`
- `GET /api/admin/sources`
- `GET /api/ai/simplify/mock`

Use SQLAlchemy persistence when a database session is available. For tests, seed-backed responses are acceptable as long as endpoints return the documented shape.

- [ ] **Step 5: Include routes in FastAPI app**

Modify `apps/api/app/main.py`:

```python
from app.api.routes import router as api_router

app.include_router(api_router)
```

Keep the existing CORS and `/health` code.

- [ ] **Step 6: Run API tests to verify they pass**

Run:

```bash
cd apps/api
python3 -m pytest tests/test_api_smoke.py -v
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app/schemas.py apps/api/app/api apps/api/app/main.py apps/api/tests/test_api_smoke.py
git commit -m "feat: expose backend MVP API"
```

## Task 5: Frontend Scaffold and Shared UI

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/postcss.config.mjs`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/.env.example`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/components/app-shell.tsx`
- Create: `apps/web/components/disclaimer.tsx`
- Create: `apps/web/components/score-bar.tsx`
- Create: `apps/web/components/cards.tsx`
- Create: `apps/web/lib/types.ts`
- Create: `apps/web/lib/api.ts`

- [ ] **Step 1: Create Next.js package and config files**

Create a Next.js app manually in `apps/web` with scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "tailwindcss": "latest",
    "typescript": "latest"
  },
  "devDependencies": {
    "autoprefixer": "latest",
    "postcss": "latest"
  }
}
```

- [ ] **Step 2: Add theme CSS**

Create `apps/web/app/globals.css` with Tailwind directives and CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #f8faf8;
  --foreground: #14213d;
  --navy: #17324d;
  --blue: #2f80ed;
  --green: #2e7d5b;
  --border: #d9e2ec;
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 3: Add shared types and API client**

Create `apps/web/lib/types.ts` with TypeScript interfaces for `Program`, `DocumentItem`, `ReadinessScore`, `Task`, `MatchResult`, and `ProfilePayload`.

Create `apps/web/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("We could not load that information. Please try again.");
  }

  return response.json() as Promise<T>;
}

export const api = {
  getPrograms: () => request("/api/programs"),
  getProgram: (id: string) => request(`/api/programs/${id}`),
  getDocuments: () => request("/api/documents"),
  getDocument: (id: string) => request(`/api/documents/${id}`),
  submitProfile: (payload: unknown) => request("/api/profiles", { method: "POST", body: JSON.stringify(payload) }),
  getDashboard: (userId: string) => request(`/api/profiles/${userId}/dashboard`),
  getMatches: (userId: string) => request(`/api/profiles/${userId}/matches`),
  saveItem: (payload: unknown) => request("/api/saved-items", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (taskId: string, payload: unknown) => request(`/api/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getAdminSources: () => request("/api/admin/sources"),
};
```

- [ ] **Step 4: Add layout and shared components**

Create `AppShell`, `Disclaimer`, `ScoreBar`, and card components. Keep components focused and avoid nested card containers.

- [ ] **Step 5: Run frontend typecheck**

Run:

```bash
cd apps/web
npm install
npm run typecheck
```

Expected: PASS after dependencies install.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: scaffold Next.js frontend"
```

## Task 6: Landing Page and Wizard

**Files:**
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/wizard/page.tsx`
- Create: `apps/web/components/wizard-form.tsx`

- [ ] **Step 1: Add landing page**

Create `apps/web/app/page.tsx` with a light Maryland-first hero, primary CTA linking to `/wizard`, core value cards for funding, paperwork, and readiness, and the educational disclaimer.

- [ ] **Step 2: Add wizard form**

Create `apps/web/components/wizard-form.tsx` as a client component with seven steps matching the spec. On submit, call `api.submitProfile(payload)`, store returned `user.id` in `localStorage` under `smbfn_user_id`, and route to `/dashboard`.

- [ ] **Step 3: Add wizard page**

Create `apps/web/app/wizard/page.tsx` that renders `WizardForm` inside `AppShell`.

- [ ] **Step 4: Verify locally**

Run backend:

```bash
cd apps/api
python3 -m uvicorn app.main:app --reload --port 8000
```

Run frontend:

```bash
cd apps/web
npm run dev
```

Open `http://localhost:3000`, complete the wizard, and confirm navigation to `/dashboard`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/page.tsx apps/web/app/wizard apps/web/components/wizard-form.tsx
git commit -m "feat: add landing page and profile wizard"
```

## Task 7: Dashboard, Funding, Paperwork, Tasks, and Admin Pages

**Files:**
- Create: `apps/web/app/dashboard/page.tsx`
- Create: `apps/web/app/funding/page.tsx`
- Create: `apps/web/app/funding/[programId]/page.tsx`
- Create: `apps/web/app/paperwork/page.tsx`
- Create: `apps/web/app/paperwork/[documentId]/page.tsx`
- Create: `apps/web/app/tasks/page.tsx`
- Create: `apps/web/app/admin/sources/page.tsx`

- [ ] **Step 1: Add dashboard page**

Create a client page that reads `smbfn_user_id`, calls `api.getDashboard(userId)`, and displays readiness score bars, missing paperwork, priority tasks, saved items, and top matches.

- [ ] **Step 2: Add funding list and detail pages**

Create a funding list page that calls `api.getPrograms()` and a detail page that calls `api.getProgram(programId)`. Show official source links, cautious eligibility language, documents likely needed, difficulty, estimated time, confidence, and next action.

- [ ] **Step 3: Add paperwork list and detail pages**

Create paperwork pages that call `api.getDocuments()` and `api.getDocument(documentId)`. Group or label records by category and show all plain-English document fields.

- [ ] **Step 4: Add tasks page**

Create a tasks page that loads dashboard tasks and lets users mark tasks complete through `api.updateTask(task.id, { status: "complete" })`.

- [ ] **Step 5: Add admin source page**

Create `/admin/sources` that calls `api.getAdminSources()` and displays source names, agencies, URLs, last checked dates, program count, and document count.

- [ ] **Step 6: Verify route coverage**

Run:

```bash
cd apps/web
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/dashboard apps/web/app/funding apps/web/app/paperwork apps/web/app/tasks apps/web/app/admin
git commit -m "feat: add MVP application pages"
```

## Task 8: Database Migrations, Runtime Persistence, and Seed Command

**Files:**
- Create: `apps/api/alembic.ini`
- Create: `apps/api/app/migrations/env.py`
- Modify: `apps/api/app/api/routes.py`
- Modify: `apps/api/app/seed.py`
- Modify: `apps/api/pyproject.toml`

- [ ] **Step 1: Add Alembic configuration**

Create Alembic config using `app.models.Base.metadata` as target metadata and `DATABASE_URL` from settings.

- [ ] **Step 2: Generate initial migration**

Run:

```bash
cd apps/api
python3 -m alembic revision --autogenerate -m "initial schema"
```

Expected: migration file creates all tables from `models.py`.

- [ ] **Step 3: Wire API routes to database persistence**

Update routes so:

- `POST /api/profiles` upserts user by email.
- `POST /api/profiles` creates or updates one profile per user.
- Match results are deleted and regenerated for the profile.
- Tasks are generated if missing.
- `GET /dashboard`, `GET /matches`, saved item routes, and task update routes use database records.
- Seed constants remain available as fallback only for list pages before seeding.

- [ ] **Step 4: Add seed command**

Update `apps/api/app/seed.py` so it can run:

```bash
cd apps/api
python3 -m app.seed
```

Expected: sources, programs, and documents are inserted or updated by name.

- [ ] **Step 5: Verify with local Postgres**

Run:

```bash
cd apps/api
python3 -m alembic upgrade head
python3 -m app.seed
python3 -m pytest -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/alembic.ini apps/api/app/migrations apps/api/app/api/routes.py apps/api/app/seed.py apps/api/pyproject.toml
git commit -m "feat: add PostgreSQL persistence and migrations"
```

## Task 9: README and Deployment Guide

**Files:**
- Create: `README.md`
- Create: `apps/api/README.md`
- Modify: `apps/web/.env.example`

- [ ] **Step 1: Write root README**

Document:

- Product purpose
- Monorepo layout
- Local prerequisites
- Backend setup
- Frontend setup
- Local Postgres setup
- Test commands
- Vercel deployment
- Railway backend deployment
- Railway PostgreSQL setup
- Environment variables
- Migration and seed commands
- CORS configuration
- Health check URL
- Safety disclaimers
- Future roadmap

- [ ] **Step 2: Write backend README**

Document:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python3 -m alembic upgrade head
python3 -m app.seed
python3 -m uvicorn app.main:app --reload --port 8000
python3 -m pytest -v
```

- [ ] **Step 3: Verify docs mention all deployment variables**

Run:

```bash
rg -n "NEXT_PUBLIC_API_BASE_URL|DATABASE_URL|CORS_ORIGINS|Railway|Vercel|alembic|seed" README.md apps/api/README.md apps/web/.env.example
```

Expected: each required term appears.

- [ ] **Step 4: Commit**

```bash
git add README.md apps/api/README.md apps/web/.env.example
git commit -m "docs: add setup and deployment guide"
```

## Task 10: Final Verification

**Files:**
- Modify only files needed to fix verification failures.

- [ ] **Step 1: Run backend tests**

```bash
cd apps/api
python3 -m pytest -v
```

Expected: PASS.

- [ ] **Step 2: Run frontend checks**

```bash
cd apps/web
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run local vertical-flow verification**

Start backend and frontend, then verify:

1. `/` loads.
2. `/wizard` submits a Maryland business profile.
3. `/dashboard` shows all six scores.
4. `/funding` lists seeded programs.
5. `/funding/[programId]` shows official source and next action.
6. `/paperwork` lists seeded documents.
7. `/paperwork/[documentId]` shows step-by-step guidance.
8. `/tasks` marks a task complete.
9. `/admin/sources` shows seeded source visibility.

- [ ] **Step 4: Commit any final fixes**

```bash
git status --short
git add <changed-files>
git commit -m "fix: complete MVP verification"
```

Expected: no uncommitted MVP implementation changes remain after the final commit.

## Spec Coverage Check

- Split frontend/backend architecture: Tasks 1, 5, 8, 9.
- Vercel/Railway/PostgreSQL deployment path: Tasks 8 and 9.
- Email-only account profile wizard: Tasks 4 and 6.
- Readiness scoring: Task 3 and dashboard in Task 7.
- Funding matches: Tasks 3, 4, and 7.
- Paperwork library: Tasks 2, 4, and 7.
- Saved checklist/tasks: Tasks 3, 4, and 7.
- Basic admin/source management: Tasks 4 and 7.
- Mock AI simplifier boundary: Task 4.
- Official source links and disclaimers: Tasks 2, 6, 7, and 9.
- README setup and roadmap: Task 9.
