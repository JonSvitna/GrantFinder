from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_waitlist_create_returns_201():
    response = client.post(
        "/api/waitlist",
        json={"email": "founder@example.com", "first_name": "Alex", "source": "landing_hero"},
    )
    assert response.status_code == 201
    assert response.json()["email"] == "founder@example.com"


def test_waitlist_duplicate_is_idempotent():
    payload = {"email": "dup@example.com", "first_name": "Sam", "source": "paywall"}
    first = client.post("/api/waitlist", json=payload)
    second = client.post("/api/waitlist", json=payload)
    assert first.status_code == 201
    assert second.status_code == 200
