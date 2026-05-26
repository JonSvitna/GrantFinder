from app.services.readiness import calculate_readiness
from app.services.tasks import generate_tasks


def test_readiness_scores_penalize_missing_procurement_documents():
    profile = {
        "has_ein": True,
        "has_business_bank_account": True,
        "has_w9": False,
        "has_sam_registration": False,
        "has_emma_account": False,
        "interested_in_government_contracts": True,
        "funding_needs": ["government contracting"],
    }

    readiness = calculate_readiness(profile)

    assert readiness["paperwork"]["score"] < 100
    assert readiness["sam_gov"]["score"] < 50
    assert readiness["emma"]["score"] < 50
    assert "Complete IRS W-9" in readiness["missing_paperwork"]


def test_task_generation_creates_priority_actions():
    profile = {
        "has_ein": False,
        "has_business_bank_account": False,
        "has_w9": False,
        "has_sam_registration": False,
        "has_emma_account": False,
        "interested_in_government_contracts": True,
        "funding_needs": ["startup capital", "government contracting"],
    }

    tasks = generate_tasks(profile)
    titles = [task["title"] for task in tasks]

    assert "Apply for an EIN" in titles
    assert "Complete IRS W-9" in titles
    assert "Start SAM.gov registration" in titles
