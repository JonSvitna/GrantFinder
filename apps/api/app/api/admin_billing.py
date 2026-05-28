import csv
import io

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import User, WaitlistLead
from app.services.subscriptions import FOUNDER_CAP, active_founder_count

router = APIRouter(prefix="/api/admin")


@router.get("/leads")
def list_leads(
    format: str | None = Query(default=None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    leads = db.scalars(select(WaitlistLead).order_by(WaitlistLead.created_at.desc())).all()
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["email", "first_name", "source", "created_at"])
        for lead in leads:
            writer.writerow([lead.email, lead.first_name, lead.source, lead.created_at.isoformat()])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=leads.csv"},
        )
    return [
        {
            "email": lead.email,
            "first_name": lead.first_name,
            "source": lead.source,
            "created_at": lead.created_at.isoformat(),
        }
        for lead in leads
    ]


@router.get("/founders")
def list_founders(db: Session = Depends(get_db), admin: User = Depends(require_admin)) -> dict:
    founders = db.scalars(select(User).where(User.founder_number.is_not(None)).order_by(User.founder_number)).all()
    count = active_founder_count(db)
    return {
        "seat_count": count,
        "cap": FOUNDER_CAP,
        "founders": [
            {
                "founder_number": founder.founder_number,
                "email": founder.email,
                "first_name": founder.first_name,
                "subscription_status": founder.subscription_status,
                "subscribed_at": founder.subscribed_at.isoformat() if founder.subscribed_at else None,
            }
            for founder in founders
        ],
    }
