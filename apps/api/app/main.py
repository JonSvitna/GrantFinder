from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin_billing import router as admin_billing_router
from app.api.billing import router as billing_router
from app.api.routes import router as api_router
from app.api.waitlist import router as waitlist_router
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

app.include_router(api_router)
app.include_router(waitlist_router)
app.include_router(billing_router)
app.include_router(admin_billing_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
