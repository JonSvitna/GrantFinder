from pydantic import BaseModel, EmailStr, Field


class ProfileInput(BaseModel):
    email: EmailStr
    business_name: str
    county: str
    stage: str
    industry: str
    entity_type: str
    revenue_range: str
    employee_count: int = Field(ge=0)
    hiring_plans: bool
    funding_needs: list[str]
    has_ein: bool
    has_business_bank_account: bool
    has_w9: bool
    has_sam_registration: bool
    has_emma_account: bool
    interested_in_government_contracts: bool
    ownership_statuses: list[str] = []
    location_type: str | None = None


class SavedItemInput(BaseModel):
    user_id: str
    item_type: str
    program_id: str | None = None
    document_id: str | None = None


class TaskUpdateInput(BaseModel):
    status: str


class WaitlistInput(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    source: str = Field(pattern=r"^(landing_hero|landing_footer|paywall|founder_page)$")
