"""initial schema

Revision ID: 20260526_0001
Revises:
Create Date: 2026-05-26
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260526_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "sources",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("agency", sa.String(), nullable=False),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("jurisdiction", sa.String(), nullable=False),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("last_checked_at", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "business_profiles",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("business_name", sa.String(), nullable=False),
        sa.Column("county", sa.String(), nullable=False),
        sa.Column("stage", sa.String(), nullable=False),
        sa.Column("industry", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("revenue_range", sa.String(), nullable=False),
        sa.Column("employee_count", sa.Integer(), nullable=False),
        sa.Column("hiring_plans", sa.Boolean(), nullable=False),
        sa.Column("funding_needs", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("has_ein", sa.Boolean(), nullable=False),
        sa.Column("has_business_bank_account", sa.Boolean(), nullable=False),
        sa.Column("has_w9", sa.Boolean(), nullable=False),
        sa.Column("has_sam_registration", sa.Boolean(), nullable=False),
        sa.Column("has_emma_account", sa.Boolean(), nullable=False),
        sa.Column("interested_in_government_contracts", sa.Boolean(), nullable=False),
        sa.Column("ownership_statuses", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("location_type", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "programs",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("funding_type", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("best_fit", sa.Text(), nullable=False),
        sa.Column("eligibility_summary", sa.Text(), nullable=False),
        sa.Column("required_documents", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("difficulty", sa.String(), nullable=False),
        sa.Column("estimated_time", sa.String(), nullable=False),
        sa.Column("official_url", sa.String(), nullable=False),
        sa.Column("last_checked_at", sa.Date(), nullable=True),
        sa.Column("confidence", sa.String(), nullable=False),
        sa.Column("next_action", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("who_needs_it", sa.Text(), nullable=False),
        sa.Column("why_it_matters", sa.Text(), nullable=False),
        sa.Column("required_information", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("common_mistakes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("official_url", sa.String(), nullable=False),
        sa.Column("steps", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["source_id"], ["sources.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "match_results",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("profile_id", sa.String(), nullable=False),
        sa.Column("program_id", sa.String(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("confidence", sa.String(), nullable=False),
        sa.Column("fit_reason", sa.Text(), nullable=False),
        sa.Column("next_action", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["business_profiles.id"]),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "tasks",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("profile_id", sa.String(), nullable=True),
        sa.Column("program_id", sa.String(), nullable=True),
        sa.Column("document_id", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("priority", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
        sa.ForeignKeyConstraint(["profile_id"], ["business_profiles.id"]),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "saved_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("item_type", sa.String(), nullable=False),
        sa.Column("program_id", sa.String(), nullable=True),
        sa.Column("document_id", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("saved_items")
    op.drop_table("tasks")
    op.drop_table("match_results")
    op.drop_table("documents")
    op.drop_table("programs")
    op.drop_table("business_profiles")
    op.drop_table("sources")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
