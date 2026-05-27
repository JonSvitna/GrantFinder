import json
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.models import User

client = TestClient(app)

CHECKOUT_EVENT = {
    "id": "evt_test_checkout",
    "type": "checkout.session.completed",
    "data": {
        "object": {
            "id": "cs_test",
            "customer": "cus_test",
            "subscription": "sub_test",
            "client_reference_id": None,
        }
    },
}


def test_stripe_webhook_checkout_assigns_founder_number(test_db):
    db = test_db()
    try:
        user = User(email="founder@example.com", supabase_user_id="founder-uuid")
        db.add(user)
        db.commit()
        db.refresh(user)

        event = {
            **CHECKOUT_EVENT,
            "data": {
                "object": {
                    **CHECKOUT_EVENT["data"]["object"],
                    "client_reference_id": user.id,
                }
            },
        }

        with patch("app.api.billing.stripe.Webhook.construct_event", return_value=event):
            response = client.post(
                "/api/webhooks/stripe",
                content=json.dumps(event),
                headers={"Stripe-Signature": "test_sig"},
            )

        assert response.status_code == 200
        assert response.json()["received"] is True

        db.expire_all()
        updated = db.get(User, user.id)
        assert updated is not None
        assert updated.subscription_status == "active"
        assert updated.founder_number == 1
        assert updated.stripe_customer_id == "cus_test"
        assert updated.stripe_subscription_id == "sub_test"
    finally:
        db.close()


def test_stripe_webhook_is_idempotent(test_db):
    db = test_db()
    try:
        user = User(email="founder2@example.com", supabase_user_id="founder-uuid-2")
        db.add(user)
        db.commit()
        db.refresh(user)

        event = {
            **CHECKOUT_EVENT,
            "id": "evt_test_idempotent",
            "data": {
                "object": {
                    **CHECKOUT_EVENT["data"]["object"],
                    "client_reference_id": user.id,
                }
            },
        }

        with patch("app.api.billing.stripe.Webhook.construct_event", return_value=event):
            first = client.post(
                "/api/webhooks/stripe",
                content=json.dumps(event),
                headers={"Stripe-Signature": "test_sig"},
            )
            second = client.post(
                "/api/webhooks/stripe",
                content=json.dumps(event),
                headers={"Stripe-Signature": "test_sig"},
            )

        assert first.status_code == 200
        assert second.status_code == 200
        db.expire_all()
        updated = db.get(User, user.id)
        assert updated is not None
        assert updated.founder_number == 1
    finally:
        db.close()


def test_billing_cap_endpoint(test_db):
    response = client.get("/api/billing/cap")
    assert response.status_code == 200
    body = response.json()
    assert body["active_founders"] == 0
    assert body["spots_remaining"] == 50
    assert body["cap_reached"] is False
