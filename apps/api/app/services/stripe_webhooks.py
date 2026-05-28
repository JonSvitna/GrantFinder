import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import StripeEvent, User
from app.services.subscriptions import ACTIVE_STATUSES, FOUNDER_CAP

logger = logging.getLogger(__name__)


def handle_stripe_event(db: Session, event: dict) -> None:
    event_id = event["id"]
    if db.get(StripeEvent, event_id):
        return

    event_type = event["type"]
    if event_type == "checkout.session.completed":
        _handle_checkout_completed(db, event)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(db, event)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(db, event)

    db.add(StripeEvent(id=event_id))
    db.commit()


def _handle_checkout_completed(db: Session, event: dict) -> None:
    session = event["data"]["object"]
    user_id = session.get("client_reference_id")
    if not user_id:
        logger.error("checkout.session.completed missing client_reference_id")
        return

    user = db.get(User, user_id)
    if not user:
        logger.error("User not found for checkout: %s", user_id)
        return

    user.stripe_customer_id = session.get("customer")
    user.stripe_subscription_id = session.get("subscription")
    user.subscription_status = "active"
    user.subscribed_at = datetime.now(timezone.utc)
    _assign_founder_number(db, user)
    db.add(user)
    db.flush()


def _assign_founder_number(db: Session, user: User) -> None:
    if user.founder_number is not None:
        return

    db.scalar(select(func.max(User.founder_number)).with_for_update())

    active_count = (
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.subscription_status.in_(ACTIVE_STATUSES))
            .where(User.founder_number.is_not(None))
        )
        or 0
    )
    if active_count >= FOUNDER_CAP:
        logger.error("Founder cap reached for user %s - manual review needed", user.id)
        return

    max_num = db.scalar(select(func.max(User.founder_number))) or 0
    user.founder_number = max_num + 1


def _handle_subscription_updated(db: Session, event: dict) -> None:
    subscription = event["data"]["object"]
    sub_id = subscription["id"]
    user = db.scalar(select(User).where(User.stripe_subscription_id == sub_id))
    if not user:
        return
    user.subscription_status = subscription.get("status", "none")
    db.add(user)


def _handle_subscription_deleted(db: Session, event: dict) -> None:
    subscription = event["data"]["object"]
    sub_id = subscription["id"]
    user = db.scalar(select(User).where(User.stripe_subscription_id == sub_id))
    if not user:
        return
    user.subscription_status = "canceled"
    db.add(user)
