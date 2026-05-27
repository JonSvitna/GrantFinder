"""founder access schema

Revision ID: 20260527_0002
Revises: 20260526_0001
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa

revision = "20260527_0002"
down_revision = "20260526_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "waitlist_leads",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_waitlist_leads_email"), "waitlist_leads", ["email"], unique=True)

    op.create_table(
        "stripe_events",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column("users", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("supabase_user_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("stripe_subscription_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("subscription_status", sa.String(), server_default="none", nullable=False))
    op.add_column("users", sa.Column("founder_number", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("founder_locked_price", sa.String(), server_default="19.00", nullable=False))
    op.add_column("users", sa.Column("subscribed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_index(op.f("ix_users_supabase_user_id"), "users", ["supabase_user_id"], unique=True)
    op.create_index(op.f("ix_users_stripe_customer_id"), "users", ["stripe_customer_id"], unique=True)
    op.create_index(op.f("ix_users_stripe_subscription_id"), "users", ["stripe_subscription_id"], unique=True)
    op.create_index(op.f("ix_users_founder_number"), "users", ["founder_number"], unique=True)
    op.create_index(op.f("ix_users_subscription_status"), "users", ["subscription_status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_subscription_status"), table_name="users")
    op.drop_index(op.f("ix_users_founder_number"), table_name="users")
    op.drop_index(op.f("ix_users_stripe_subscription_id"), table_name="users")
    op.drop_index(op.f("ix_users_stripe_customer_id"), table_name="users")
    op.drop_index(op.f("ix_users_supabase_user_id"), table_name="users")
    op.drop_column("users", "subscribed_at")
    op.drop_column("users", "founder_locked_price")
    op.drop_column("users", "founder_number")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "stripe_subscription_id")
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "supabase_user_id")
    op.drop_column("users", "first_name")
    op.drop_table("stripe_events")
    op.drop_index(op.f("ix_waitlist_leads_email"), table_name="waitlist_leads")
    op.drop_table("waitlist_leads")
