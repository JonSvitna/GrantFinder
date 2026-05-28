import jwt
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User


def _decode_supabase_token(authorization: str | None) -> dict:
    settings = get_settings()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        return jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    claims = _decode_supabase_token(authorization)
    email = (claims.get("email") or "").lower()
    supabase_user_id = claims.get("sub")
    if not email or not supabase_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid claims")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, supabase_user_id=supabase_user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.supabase_user_id != supabase_user_id:
        user.supabase_user_id = supabase_user_id
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_current_user_optional(
    authorization: str | None = Header(default=None), db: Session = Depends(get_db)
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return get_current_user(authorization=authorization, db=db)


def require_admin(user: User = Depends(get_current_user)) -> User:
    settings = get_settings()
    admins = {email.strip().lower() for email in settings.admin_emails.split(",") if email.strip()}
    if user.email.lower() not in admins:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user
