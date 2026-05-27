import jwt
from fastapi.testclient import TestClient

from app.auth import get_current_user
from app.config import get_settings
from app.main import app

client = TestClient(app)


def test_get_current_user_decodes_valid_jwt(test_db):
    db = test_db()
    try:
        settings = get_settings()
        token = jwt.encode(
            {"email": "user@example.com", "sub": "supabase-uuid-123", "aud": "authenticated"},
            settings.supabase_jwt_secret,
            algorithm="HS256",
        )
        user = get_current_user(authorization=f"Bearer {token}", db=db)
        assert user.email == "user@example.com"
        assert user.supabase_user_id == "supabase-uuid-123"
    finally:
        db.close()


def test_get_current_user_rejects_missing_token(test_db):
    db = test_db()
    try:
        response = client.get("/api/me/subscription")
        assert response.status_code == 401
    finally:
        db.close()


def test_require_admin_allows_configured_admin(test_db):
    db = test_db()
    try:
        settings = get_settings()
        token = jwt.encode(
            {"email": "admin@example.com", "sub": "admin-uuid", "aud": "authenticated"},
            settings.supabase_jwt_secret,
            algorithm="HS256",
        )
        response = client.get("/api/admin/leads", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
    finally:
        db.close()


def test_require_admin_rejects_non_admin(test_db):
    db = test_db()
    try:
        settings = get_settings()
        token = jwt.encode(
            {"email": "user@example.com", "sub": "user-uuid", "aud": "authenticated"},
            settings.supabase_jwt_secret,
            algorithm="HS256",
        )
        response = client.get("/api/admin/leads", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403
    finally:
        db.close()
