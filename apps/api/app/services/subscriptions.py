FOUNDER_CAP = 50
ACTIVE_STATUSES = {"active", "past_due"}


def active_founder_count(db) -> int:
    from sqlalchemy import func, select

    from app.models import User

    return (
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.subscription_status.in_(ACTIVE_STATUSES))
            .where(User.founder_number.is_not(None))
        )
        or 0
    )


def spots_remaining(active_count: int) -> int:
    return max(0, FOUNDER_CAP - active_count)


def cap_reached(active_count: int) -> bool:
    return active_count >= FOUNDER_CAP
