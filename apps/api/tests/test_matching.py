from app.seed import PROGRAM_SEEDS
from app.services.matching import generate_matches


def test_procurement_profile_gets_sam_and_emma_matches():
    profile = {
        "funding_needs": ["government contracting"],
        "interested_in_government_contracts": True,
        "has_sam_registration": False,
        "has_emma_account": False,
        "ownership_statuses": [],
        "location_type": "urban",
        "hiring_plans": False,
    }

    matches = generate_matches(profile, PROGRAM_SEEDS)
    names = [match["program"]["name"] for match in matches]

    assert "SAM.gov Entity Registration" in names
    assert "eMMA Vendor Registration" in names
    assert matches[0]["score"] >= matches[-1]["score"]
