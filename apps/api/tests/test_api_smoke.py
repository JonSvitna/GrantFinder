from fastapi.testclient import TestClient

from app.main import app
from app.seed import DOCUMENT_SEEDS, PROGRAM_SEEDS, SOURCE_SEEDS


def test_health_returns_status_ok():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_seed_data_contains_required_mvp_records():
    assert len(SOURCE_SEEDS) >= 10
    assert len(PROGRAM_SEEDS) >= 10
    assert len(DOCUMENT_SEEDS) >= 13
    assert any(program["name"] == "SBA Microloan" for program in PROGRAM_SEEDS)
    assert any(document["name"] == "IRS W-9" for document in DOCUMENT_SEEDS)


def test_programs_and_documents_list_endpoints_return_seeded_data():
    client = TestClient(app)

    programs = client.get("/api/programs")
    documents = client.get("/api/documents")

    assert programs.status_code == 200
    assert documents.status_code == 200
    assert len(programs.json()) >= 10
    assert len(documents.json()) >= 13


def test_profile_submission_returns_preview_payload():
    client = TestClient(app)
    payload = {
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

    response = client.post("/api/profiles", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["preview"] is True
    assert body["user"]["email"] == "owner@example.com"
    assert "categories" in body
    assert "matches" not in body
