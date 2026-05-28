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
