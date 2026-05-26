# SMB Funding Navigator API

FastAPI backend for SMB Funding Navigator. It is designed for Railway deployment with PostgreSQL.

## Local Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python3 -m pytest -v
```

## Run Locally

```bash
python3 -m uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## PostgreSQL Setup

Set:

```bash
export DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/grantfinder"
export CORS_ORIGINS="http://localhost:3000"
```

Run:

```bash
python3 -m alembic upgrade head
python3 -m app.seed
```

## Railway Variables

```text
DATABASE_URL=postgresql+psycopg://...
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:3000
ENVIRONMENT=production
```

After deploy, run:

```bash
python3 -m alembic upgrade head
python3 -m app.seed
```

## Main API Routes

- `GET /health`
- `POST /api/profiles`
- `GET /api/profiles/{user_id}/dashboard`
- `GET /api/profiles/{user_id}/matches`
- `GET /api/programs`
- `GET /api/programs/{program_id}`
- `GET /api/documents`
- `GET /api/documents/{document_id}`
- `POST /api/saved-items`
- `DELETE /api/saved-items/{saved_item_id}`
- `PATCH /api/tasks/{task_id}`
- `GET /api/admin/sources`
- `GET /api/ai/simplify/mock`
