"""CLI entrypoint to seed (or reset + seed) the database with sample data.

Usage:
    uv run python -m app.seed_cli           # idempotent seed
    uv run python -m app.seed_cli --reset   # wipe all cities/actions, then seed
    uv run python -m app.seed_cli --status  # print current data without writing

The FastAPI lifespan also seeds on startup; this CLI gives manual control for
demos, reproducible local resets, and DB inspection without booting uvicorn.
"""

from __future__ import annotations

import argparse
import logging
import sys

from sqlmodel import Session, delete, select

from .db import get_engine, init_db
from .models import Action, City
from .seed import seed_if_empty

logger = logging.getLogger("climate_tracker.seed_cli")
logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")


def _reset(session: Session) -> None:
    logger.info("Wiping existing cities and actions…")
    session.exec(delete(Action))  # type: ignore[arg-type]
    session.exec(delete(City))  # type: ignore[arg-type]
    session.commit()


def _status(session: Session) -> int:
    cities = list(session.exec(select(City)).all())
    if not cities:
        logger.info("No cities in the database.")
        return 0
    for city in cities:
        action_count = len(session.exec(select(Action).where(Action.city_id == city.id)).all())
        logger.info(
            "City %s · id=%s · baseline=%s t/yr · target=%s · actions=%d",
            city.name,
            city.id,
            city.baseline_emissions,
            city.target_year,
            action_count,
        )
    return len(cities)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="seed_cli",
        description="Seed sample climate data (Greenville).",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Wipe all cities and actions before seeding.",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Print current data without modifying the database.",
    )
    args = parser.parse_args(argv)

    init_db()
    engine = get_engine()

    with Session(engine) as session:
        if args.status:
            count = _status(session)
            return 0 if count >= 0 else 1

        if args.reset:
            _reset(session)

        city = seed_if_empty(session)
        action_count = len(
            session.exec(select(Action).where(Action.city_id == city.id)).all()
        )
        logger.info(
            "Seeded %s · id=%s · baseline=%s t/yr · target=%s · actions=%d",
            city.name,
            city.id,
            city.baseline_emissions,
            city.target_year,
            action_count,
        )
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
