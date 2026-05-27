import csv
import io

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import get_settings
from app.database import get_db
from app.models import User
from app.services.stripe_webhooks import handle_stripe_event
from app.services.subscriptions import FOUNDER_CAP, active_founder_count, cap_reached, spots_remaining

router = APIRouter(prefix="/api")


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
) -> dict[str, bool]:
    settings = get_settings()
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.stripe_webhook_secret)
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload") from exc

    handle_stripe_event(db, event)
    return {"received": True}


@router.get("/me/subscription")
def get_my_subscription(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    count = active_founder_count(db)
    return {
        "status": user.subscription_status,
        "founder_number": user.founder_number,
        "spots_remaining": spots_remaining(count),
        "email": user.email,
    }


@router.get("/billing/cap")
def get_billing_cap(db: Session = Depends(get_db)) -> dict:
    count = active_founder_count(db)
    return {
        "active_founders": count,
        "spots_remaining": spots_remaining(count),
        "cap_reached": cap_reached(count),
    }
