"""Verifies migrations are reversible: upgrade head, downgrade base, upgrade head."""

import os
from pathlib import Path

import pytest

pytestmark = pytest.mark.skipif(
    "POSTGRES_TEST_URL" not in os.environ,
    reason="Requires POSTGRES_TEST_URL pointing at a disposable Postgres",
)


def test_migrations_round_trip():
    from alembic import command
    from alembic.config import Config

    ini = Path(__file__).resolve().parents[1] / "alembic.ini"
    cfg = Config(str(ini))
    cfg.set_main_option("script_location", str(ini.parent / "migrations"))
    cfg.set_main_option("sqlalchemy.url", os.environ["POSTGRES_TEST_URL"])

    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
