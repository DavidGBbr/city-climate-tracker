"""city soft delete + case-insensitive unique name

Revision ID: 0002_city_soft_delete
Revises: 0001_initial
Create Date: 2026-05-20
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_city_soft_delete"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("city", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.create_index("ix_city_deleted_at", "city", ["deleted_at"])
    op.create_index(
        "ux_city_name_lower",
        "city",
        [sa.text("lower(name)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ux_city_name_lower", table_name="city")
    op.drop_index("ix_city_deleted_at", table_name="city")
    op.drop_column("city", "deleted_at")
