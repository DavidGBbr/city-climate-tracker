"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-20
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "city",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("baseline_emissions", sa.Float(), nullable=False),
        sa.Column("target_year", sa.Integer(), nullable=False),
    )
    op.create_table(
        "action",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "city_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("city.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("sector", sa.String(), nullable=False),
        sa.Column("annual_reduction", sa.Float(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("start_year", sa.Integer(), nullable=False),
    )
    op.create_index("ix_action_city_id", "action", ["city_id"])


def downgrade() -> None:
    op.drop_index("ix_action_city_id", table_name="action")
    op.drop_table("action")
    op.drop_table("city")
