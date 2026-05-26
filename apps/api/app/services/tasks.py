def generate_tasks(profile: dict) -> list[dict]:
    tasks = []

    def add(title: str, description: str, category: str, priority: str = "high") -> None:
        tasks.append(
            {
                "title": title,
                "description": description,
                "category": category,
                "priority": priority,
                "status": "open",
            }
        )

    if not profile.get("has_ein"):
        add("Apply for an EIN", "Get an Employer Identification Number from the IRS before opening accounts or completing many forms.", "paperwork")
    if not profile.get("has_business_bank_account"):
        add("Open a business bank account", "Separate business and personal finances before applying for funding.", "paperwork")
    if not profile.get("has_w9"):
        add("Complete IRS W-9", "Prepare a W-9 so agencies, primes, and customers can request taxpayer information.", "paperwork")
    if profile.get("interested_in_government_contracts") and not profile.get("has_sam_registration"):
        add("Start SAM.gov registration", "Create or update your federal entity registration and get ready for federal opportunities.", "procurement")
    if profile.get("interested_in_government_contracts") and not profile.get("has_emma_account"):
        add("Create an eMMA vendor account", "Register with Maryland's procurement portal to monitor state opportunities.", "procurement")
    if "energy savings" in set(profile.get("funding_needs") or []):
        add("Check energy rebate timing", "Review utility or Maryland energy incentives before purchasing equipment.", "funding", "medium")
    if profile.get("hiring_plans"):
        add("Outline hiring and training needs", "Write down roles, wage ranges, and training goals before contacting workforce programs.", "funding", "medium")

    return tasks
