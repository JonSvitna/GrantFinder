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
