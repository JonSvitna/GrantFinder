import jwt
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app

client = TestClient(app)

VALID_PROFILE = {
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
    "location_type": "urban",
}


def active_user_token(test_db) -> str:
    db = test_db()
    try:
        from app.models import User

        settings = get_settings()
        user = User(email="subscriber@example.com", supabase_user_id="sub-uuid", subscription_status="active")
        db.add(user)
        db.commit()
        return jwt.encode(
            {"email": user.email, "sub": user.supabase_user_id, "aud": "authenticated"},
            settings.supabase_jwt_secret,
            algorithm="HS256",
        )
    finally:
        db.close()


def test_profile_submit_without_auth_returns_preview():
    response = client.post("/api/profiles", json=VALID_PROFILE)
    body = response.json()
    assert body["preview"] is True
    assert "categories" in body
    assert "matches" not in body


def test_profile_submit_with_active_subscription_returns_full_dashboard(test_db):
    token = active_user_token(test_db)
    profile = {**VALID_PROFILE, "email": "subscriber@example.com"}
    response = client.post(
        "/api/profiles",
        json=profile,
        headers={"Authorization": f"Bearer {token}"},
    )
    body = response.json()
    assert body.get("preview") is not True
    assert "matches" in body
