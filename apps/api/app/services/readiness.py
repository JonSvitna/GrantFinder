def calculate_readiness(profile: dict) -> dict:
    missing = []
    paperwork_score = 100

    checks = [
        ("has_ein", "Apply for an EIN"),
        ("has_business_bank_account", "Open a business bank account"),
        ("has_w9", "Complete IRS W-9"),
    ]
    for field, label in checks:
        if not profile.get(field):
            paperwork_score -= 25
            missing.append(label)

    procurement_interest = bool(profile.get("interested_in_government_contracts"))
    sam_score = 100 if profile.get("has_sam_registration") else 35 if procurement_interest else 70
    emma_score = 100 if profile.get("has_emma_account") else 35 if procurement_interest else 70
    procurement_score = min(100, int((sam_score + emma_score + (100 if profile.get("has_w9") else 40)) / 3))
    funding_score = max(35, paperwork_score - (10 if not profile.get("funding_needs") else 0))
    grant_score = max(30, int((paperwork_score + funding_score) / 2))

    return {
        "funding": {
            "label": "Funding Readiness",
            "score": funding_score,
            "reason": "Funding applications are easier when core paperwork and a clear use of funds are ready.",
        },
        "procurement": {
            "label": "Procurement Readiness",
            "score": procurement_score,
            "reason": "Procurement readiness depends on W-9, SAM.gov, eMMA, and vendor profile steps.",
        },
        "paperwork": {
            "label": "Paperwork Readiness",
            "score": max(paperwork_score, 0),
            "reason": "Basic documents reduce delays when applying for funding or contracts.",
        },
        "grant": {
            "label": "Grant Readiness",
            "score": grant_score,
            "reason": "Grant readiness combines paperwork, a clear business profile, and funding purpose.",
        },
        "sam_gov": {
            "label": "SAM.gov Readiness",
            "score": sam_score,
            "reason": "SAM.gov is needed for federal contracting and some grant paths.",
        },
        "emma": {
            "label": "eMMA Readiness",
            "score": emma_score,
            "reason": "eMMA is Maryland's procurement portal for state opportunities.",
        },
        "missing_paperwork": missing,
    }
