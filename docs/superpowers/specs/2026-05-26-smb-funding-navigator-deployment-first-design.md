# SMB Funding Navigator Deployment-First MVP Design

Date: 2026-05-26
Status: Approved design draft

## Goal

Build a deployed-first MVP web platform called SMB Funding Navigator. The product helps Maryland small business owners, solo founders, startups, new LLC owners, and contractors find likely funding opportunities, understand government paperwork, and complete readiness steps faster.

The MVP is not a grant scraper. It is a plain-English funding, paperwork, and business readiness assistant. It should answer:

> What funding, incentives, certifications, forms, and registrations might fit my business, and what do I need to do next?

## First MVP Slice

The first deployed MVP optimizes for the user demo loop:

1. User lands on the site.
2. User starts the Business Profile Wizard.
3. User enters an email and business profile details.
4. The backend persists the profile in PostgreSQL.
5. The backend computes readiness scores, funding matches, missing paperwork, and tasks.
6. The frontend shows a dashboard, recommended matches, paperwork explanations, and saved checklist actions.

Admin/source management is intentionally basic in v1. It exists to inspect seeded sources, programs, and documents, not to provide a full production content management system.

## Architecture

Use a split deployment architecture from day one.

### Frontend

- App path: `apps/web`
- Stack: Next.js, React, TypeScript, TailwindCSS
- Deployment target: Vercel
- Responsibilities:
  - User-facing pages
  - Wizard form state and validation
  - Friendly plain-English UI copy
  - API client calls to the backend
  - Route transitions, loading states, and error states

### Backend

- App path: `apps/api`
- Stack: FastAPI, SQLAlchemy, Alembic, Pydantic
- Deployment target: Railway
- Responsibilities:
  - Email-only user records
  - Business profile persistence
  - Seeded program, document, and source data
  - Funding matching logic
  - Readiness scoring logic
  - Task generation
  - Saved item persistence
  - Mock AI simplification service boundary

### Database

- Primary database: Railway PostgreSQL
- Local database: local PostgreSQL using the same schema
- ORM: SQLAlchemy
- Migration tool: Alembic
- Seed data: Python seed script in the backend app

PostgreSQL is the source of truth from v1. SQLite is not the primary path because the selected MVP prioritizes real deployment architecture and future SaaS expansion.

### Deployment Configuration

Vercel frontend environment:

- `NEXT_PUBLIC_API_BASE_URL`

Railway backend environment:

- `DATABASE_URL`
- `CORS_ORIGINS`
- optional `ENVIRONMENT`

The backend must expose `GET /health` for deployment checks and frontend connectivity checks.

## Product Scope

### Landing Page

The landing page explains the product as Maryland-first funding, paperwork, and readiness guidance. It has one primary call to action: "Find Funding & Paperwork Steps."

The page includes educational guidance disclaimers without making the experience feel intimidating.

### Business Profile Wizard

The wizard collects:

- Email
- Business name
- Maryland county
- Business stage: idea, startup, active, expanding
- Industry
- Entity type: sole proprietor, LLC, corporation, nonprofit
- Revenue range
- Number of employees
- Hiring plans
- Funding needs: startup capital, working capital, equipment, hiring, training, marketing, real estate, energy savings, government contracting
- Has EIN
- Has business bank account
- Has W-9
- Has SAM.gov registration
- Has eMMA account
- Interested in government contracts
- Optional minority, woman, or veteran-owned status
- Optional rural or urban business location

Wizard steps:

1. Business basics
2. Location and stage
3. Funding needs
4. Paperwork readiness
5. Procurement readiness
6. Optional certifications and context
7. Review and generate plan

Submitting the wizard creates or updates an email-only user and one business profile.

### Dashboard

The dashboard is the user's home base after profile submission. It shows:

- Funding Readiness
- Procurement Readiness
- Paperwork Readiness
- Grant Readiness
- SAM.gov Readiness
- eMMA Readiness
- Missing paperwork
- Priority next steps
- Top funding matches
- Saved opportunities
- Open and completed tasks

### Funding Matches

The matches page lists recommended programs and categories based on the profile.

Each result includes:

- Program name
- Funding type
- Best fit
- Eligibility summary
- Documents likely needed
- Difficulty level
- Estimated time to complete
- Official source URL
- Last checked date
- Confidence level
- Next best action

All eligibility language must use cautious wording such as "likely eligible," "may qualify," or "needs review."

### Paperwork Navigator

The paperwork library includes:

- IRS W-9
- EIN
- Maryland SDAT registration
- Maryland Business Express registration
- SAM.gov registration
- Unique Entity ID / UEI
- eMMA vendor registration
- Maryland SBR / Small Business Reserve
- MBE / DBE / SBE certifications
- Capability statement
- Grant budget template
- Business personal property return
- NAICS code selection

Each document page shows:

- What this is
- Who needs it
- Why it matters
- What information is required
- Common mistakes
- Where to get the official form
- Plain-English step-by-step instructions

### Saved Checklist and Tasks

Users can save programs and documents. The backend generates checklist tasks from:

- Missing paperwork
- Procurement interest
- Funding needs
- Saved programs
- Saved documents

Users can mark tasks complete or incomplete.

### Admin and Source Management

The MVP admin page is a basic internal view of:

- Sources
- Programs
- Documents
- Official URLs
- Last checked dates

It is not a secure production admin in v1. It is a visibility tool for seeded data.

## Data Model

### `users`

Email-only account record.

Fields:

- `id`
- `email`
- `created_at`
- `updated_at`

### `business_profiles`

One profile per user in v1.

Fields:

- `id`
- `user_id`
- `business_name`
- `county`
- `stage`
- `industry`
- `entity_type`
- `revenue_range`
- `employee_count`
- `hiring_plans`
- `funding_needs`
- `has_ein`
- `has_business_bank_account`
- `has_w9`
- `has_sam_registration`
- `has_emma_account`
- `interested_in_government_contracts`
- `ownership_statuses`
- `location_type`
- `created_at`
- `updated_at`

### `sources`

Official source pages and future ingestion targets.

Fields:

- `id`
- `name`
- `agency`
- `url`
- `jurisdiction`
- `source_type`
- `last_checked_at`
- `notes`
- `created_at`
- `updated_at`

### `programs`

Seeded funding, incentive, procurement, and readiness opportunities.

Fields:

- `id`
- `source_id`
- `name`
- `funding_type`
- `category`
- `best_fit`
- `eligibility_summary`
- `required_documents`
- `difficulty`
- `estimated_time`
- `official_url`
- `last_checked_at`
- `confidence`
- `next_action`
- `created_at`
- `updated_at`

### `documents`

Plain-English paperwork library.

Fields:

- `id`
- `source_id`
- `name`
- `category`
- `summary`
- `who_needs_it`
- `why_it_matters`
- `required_information`
- `common_mistakes`
- `official_url`
- `steps`
- `created_at`
- `updated_at`

### `match_results`

Stored computed recommendations for a profile.

Fields:

- `id`
- `profile_id`
- `program_id`
- `score`
- `confidence`
- `fit_reason`
- `next_action`
- `created_at`

### `tasks`

Generated checklist items.

Fields:

- `id`
- `user_id`
- `profile_id`
- `program_id`
- `document_id`
- `title`
- `description`
- `category`
- `priority`
- `status`
- `due_date`
- `created_at`
- `updated_at`

### `saved_items`

Saved program or document references.

Fields:

- `id`
- `user_id`
- `item_type`
- `program_id`
- `document_id`
- `created_at`

## Matching and Readiness Logic

The v1 matching engine is deterministic Python code. It uses:

- County
- Business stage
- Industry
- Entity type
- Revenue range
- Employee count
- Hiring plans
- Funding needs
- Procurement interest
- Paperwork flags
- Optional ownership statuses
- Optional rural or urban location

The engine returns stable `match_results` so the user sees consistent recommendations after submitting the wizard.

Readiness scoring is deterministic and produces six scores:

- Funding Readiness
- Procurement Readiness
- Paperwork Readiness
- Grant Readiness
- SAM.gov Readiness
- eMMA Readiness

Scores are based on missing documents, incomplete steps, procurement interest, funding needs, and profile answers. The backend also returns plain-English reasons for each score.

## Initial Seed Data

Seed programs and categories:

- Maryland Business Express startup checklist
- Maryland Commerce funding/incentives
- Maryland Small Business Development Financing Authority
- eMMA vendor registration
- SAM.gov entity registration
- IRS W-9
- SBA microloan
- Workforce training grant category
- Utility rebate category
- County economic development sample program

Seed documents:

- IRS W-9
- EIN
- Maryland SDAT registration
- Maryland Business Express registration
- SAM.gov registration
- Unique Entity ID / UEI
- eMMA vendor registration
- Maryland SBR / Small Business Reserve
- MBE / DBE / SBE certifications
- Capability statement
- Grant budget template
- Business personal property return
- NAICS code selection

Seed sources:

- Maryland Business Express
- Maryland Department of Commerce
- Maryland Procurement/eMMA
- SAM.gov
- IRS W-9 page
- SBA
- Maryland county economic development sample source
- Maryland Energy Administration
- Utility rebate sample source
- Workforce development sample source

## API Design

### Health

- `GET /health`

Returns backend status and database connectivity status.

### Profiles

- `POST /api/profiles`

Creates or updates the email-only user and business profile. Runs readiness scoring, match generation, and task generation.

- `GET /api/profiles/{user_id}/dashboard`

Returns readiness scores, missing paperwork, priority actions, saved items, and tasks.

- `GET /api/profiles/{user_id}/matches`

Returns match results with program summaries.

### Programs

- `GET /api/programs`
- `GET /api/programs/{program_id}`

Program detail responses include official source, likely documents, next best action, and checklist guidance.

### Documents

- `GET /api/documents`
- `GET /api/documents/{document_id}`

Document detail responses include plain-English descriptions, common mistakes, official source links, and steps.

### Saved Items

- `POST /api/saved-items`
- `DELETE /api/saved-items/{saved_item_id}`

### Tasks

- `PATCH /api/tasks/{task_id}`

Marks a task complete or incomplete.

### Admin

- `GET /api/admin/sources`

Returns basic source, program, and document visibility for the MVP admin page.

### Mock AI

- `GET /api/ai/simplify/mock`

Returns mocked plain-English explanations from a service boundary that can later call OpenAI, Claude, or another LLM.

## Error Handling

Backend errors use a consistent shape:

```json
{
  "message": "Plain-English message",
  "code": "ERROR_CODE",
  "field_errors": {}
}
```

The frontend displays friendly messages and never exposes stack traces.

## Frontend Pages

Routes:

- `/`
- `/wizard`
- `/dashboard`
- `/funding`
- `/funding/[programId]`
- `/paperwork`
- `/paperwork/[documentId]`
- `/tasks`
- `/admin/sources`

Navigation:

- Product name
- Dashboard
- Funding
- Paperwork
- Tasks
- Admin

Visual direction:

- Light theme
- White and off-white backgrounds
- Navy, soft blue, and green accents
- Clear cards
- Progress bars
- Checklist layouts
- Minimal jargon
- Friendly next-step guidance

The UI should feel useful and trustworthy for average business owners, not technical users.

## AI Simplifier Boundary

The backend includes a mocked AI simplification service. In v1 it returns deterministic sample explanations.

Future responsibilities:

- Summarize long grant pages
- Explain PDFs
- Extract deadlines
- Extract eligibility rules
- Convert government language into checklists
- Compare a user profile against program requirements
- Flag missing documents
- Explain forms line by line

The frontend should call the service through a normal API boundary so the implementation can later connect to OpenAI, Claude, or another provider without changing page structure.

## Compliance and Safety Rules

The app must:

- Never auto-submit government forms
- Never claim guaranteed eligibility
- Always show official source links
- Use cautious language such as "likely eligible," "may qualify," or "needs review"
- State that guidance is educational and not legal, tax, or financial advice
- Help users prepare and understand paperwork, not replace official government submissions

Disclaimers appear on:

- Landing page
- Dashboard
- Program detail pages
- Document detail pages

## Testing and Verification

### Backend

Use `pytest` for:

- Matching engine
- Readiness scoring
- Profile creation and update behavior
- Task generation
- API smoke tests

### Frontend

Use:

- TypeScript checks
- Linting
- Route sanity checks
- API integration checks

### End-to-End Flow

Verify locally before deployment:

1. Landing page loads.
2. User opens wizard.
3. Wizard submits profile.
4. Dashboard renders readiness scores.
5. Funding matches render.
6. Program detail renders official source and checklist.
7. User saves an item.
8. User marks a task complete.
9. Paperwork detail renders plain-English steps.
10. Admin/source page renders seeded source visibility.

### Deployment Verification

README must document:

- Vercel frontend setup
- Railway backend setup
- Railway PostgreSQL setup
- Required environment variables
- Database migration command
- Seed command
- CORS configuration
- Health check URL

## Future Roadmap

Planned extensions after the MVP:

- Supabase Auth or equivalent real authentication
- Role-based admin access
- Full admin editing for sources, programs, documents, and rules
- Scraper/indexer jobs for Maryland state, county, SAM.gov, IRS, SBA, utility, and workforce sources
- AI document ingestion for PDFs and long source pages
- Deadline extraction
- Eligibility rule extraction
- Notification/reminder system
- Multi-business profiles per user
- Saved searches and opportunity alerts
- Payments and SaaS plan management

## Acceptance Criteria

The MVP design is complete when:

- The split frontend/backend architecture is implemented.
- Frontend deploys to Vercel.
- Backend deploys to Railway.
- Backend uses PostgreSQL.
- Seed data includes Maryland-first programs, sources, and documents.
- A user can complete the wizard using an email-only account.
- The dashboard shows readiness scores and next steps.
- Funding matches are generated from profile answers.
- Paperwork library and detail pages render plain-English guidance.
- Users can save items and complete tasks.
- Official source links and disclaimers are visible.
- README explains local setup and deployment.
