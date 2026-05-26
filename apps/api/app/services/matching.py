def generate_matches(profile: dict, programs: list[dict]) -> list[dict]:
    matches = []
    needs = set(profile.get("funding_needs") or [])
    ownership = set(profile.get("ownership_statuses") or [])

    for program in programs:
        score = 20
        reasons = []
        category = program.get("category", "")
        name = program.get("name", "")
        funding_type = program.get("funding_type", "")

        if category in needs or funding_type in needs:
            score += 35
            reasons.append(f"Matches your need for {category}.")
        if "government contracting" in needs and category in {"government contracting", "procurement"}:
            score += 20
            reasons.append("Connects to your government contracting goal.")
        if profile.get("interested_in_government_contracts") and category in {"procurement", "government contracting"}:
            score += 35
            reasons.append("Supports government contracting readiness.")
        if not profile.get("has_sam_registration") and "SAM.gov" in name:
            score += 30
            reasons.append("SAM.gov is missing from your readiness checklist.")
        if not profile.get("has_emma_account") and "eMMA" in name:
            score += 30
            reasons.append("eMMA is missing from your readiness checklist.")
        if profile.get("hiring_plans") and category in {"workforce", "training"}:
            score += 25
            reasons.append("Hiring or training plans may fit workforce incentives.")
        if ownership and category in {"certification", "minority-owned", "women-owned", "veteran-owned"}:
            score += 25
            reasons.append("Ownership status may fit certification support.")
        if profile.get("location_type") == "rural" and category == "rural":
            score += 25
            reasons.append("Rural location may open additional programs.")

        matches.append(
            {
                "program": program,
                "score": min(score, 100),
                "confidence": "high" if score >= 75 else "medium" if score >= 50 else "needs review",
                "fit_reason": " ".join(reasons) or program.get("best_fit", "May fit based on your business profile."),
                "next_action": program.get("next_action", "Review the official source and confirm eligibility."),
            }
        )

    return sorted(matches, key=lambda item: item["score"], reverse=True)
