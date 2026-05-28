import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def new_id() -> str:
    return str(uuid.uuid4())


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String, nullable=True)
    supabase_user_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)
    subscription_status: Mapped[str] = mapped_column(String, nullable=False, default="none", index=True)
    founder_number: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True, index=True)
    founder_locked_price: Mapped[str] = mapped_column(String, nullable=False, default="19.00")
    subscribed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    profile: Mapped["BusinessProfile"] = relationship(back_populates="user", uselist=False)


class WaitlistLead(TimestampMixin, Base):
    __tablename__ = "waitlist_leads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)


class StripeEvent(TimestampMixin, Base):
    __tablename__ = "stripe_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)


class BusinessProfile(TimestampMixin, Base):
    __tablename__ = "business_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    business_name: Mapped[str] = mapped_column(String, nullable=False)
    county: Mapped[str] = mapped_column(String, nullable=False)
    stage: Mapped[str] = mapped_column(String, nullable=False)
    industry: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    revenue_range: Mapped[str] = mapped_column(String, nullable=False)
    employee_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hiring_plans: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    funding_needs: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    has_ein: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_business_bank_account: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_w9: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_sam_registration: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_emma_account: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    interested_in_government_contracts: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ownership_statuses: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    location_type: Mapped[str | None] = mapped_column(String, nullable=True)

    user: Mapped[User] = relationship(back_populates="profile")


class Source(TimestampMixin, Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    agency: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    last_checked_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    programs: Mapped[list["Program"]] = relationship(back_populates="source")
    documents: Mapped[list["Document"]] = relationship(back_populates="source")


class Program(TimestampMixin, Base):
    __tablename__ = "programs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    funding_type: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    best_fit: Mapped[str] = mapped_column(Text, nullable=False)
    eligibility_summary: Mapped[str] = mapped_column(Text, nullable=False)
    required_documents: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    difficulty: Mapped[str] = mapped_column(String, nullable=False)
    estimated_time: Mapped[str] = mapped_column(String, nullable=False)
    official_url: Mapped[str] = mapped_column(String, nullable=False)
    last_checked_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    confidence: Mapped[str] = mapped_column(String, nullable=False)
    next_action: Mapped[str] = mapped_column(Text, nullable=False)

    source: Mapped[Source | None] = relationship(back_populates="programs")


class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    source_id: Mapped[str | None] = mapped_column(ForeignKey("sources.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    who_needs_it: Mapped[str] = mapped_column(Text, nullable=False)
    why_it_matters: Mapped[str] = mapped_column(Text, nullable=False)
    required_information: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    common_mistakes: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    official_url: Mapped[str] = mapped_column(String, nullable=False)
    steps: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    source: Mapped[Source | None] = relationship(back_populates="documents")


class MatchResult(Base):
    __tablename__ = "match_results"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("business_profiles.id"), nullable=False)
    program_id: Mapped[str] = mapped_column(ForeignKey("programs.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[str] = mapped_column(String, nullable=False)
    fit_reason: Mapped[str] = mapped_column(Text, nullable=False)
    next_action: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Task(TimestampMixin, Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    profile_id: Mapped[str | None] = mapped_column(ForeignKey("business_profiles.id"), nullable=True)
    program_id: Mapped[str | None] = mapped_column(ForeignKey("programs.id"), nullable=True)
    document_id: Mapped[str | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    priority: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="open")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class SavedItem(Base):
    __tablename__ = "saved_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    item_type: Mapped[str] = mapped_column(String, nullable=False)
    program_id: Mapped[str | None] = mapped_column(ForeignKey("programs.id"), nullable=True)
    document_id: Mapped[str | None] = mapped_column(ForeignKey("documents.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
