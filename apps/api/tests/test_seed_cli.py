"""Tests for the standalone seed CLI."""

from sqlmodel import Session, select

from app.models import Action, City
from app.seed_cli import main


def test_cli_seeds_empty_db(engine):
    exit_code = main([])
    assert exit_code == 0

    with Session(engine) as s:
        cities = s.exec(select(City)).all()
        actions = s.exec(select(Action)).all()
        assert len(cities) == 1
        assert cities[0].name == "Greenville"
        assert len(actions) == 6


def test_cli_is_idempotent(engine):
    main([])
    main([])
    with Session(engine) as s:
        assert len(s.exec(select(City)).all()) == 1
        assert len(s.exec(select(Action)).all()) == 6


def test_cli_reset_wipes_then_seeds(engine):
    main([])
    # Mutate state so we can detect the wipe
    with Session(engine) as s:
        city = s.exec(select(City)).one()
        city.name = "Mutated"
        s.add(city)
        s.commit()

    main(["--reset"])

    with Session(engine) as s:
        city = s.exec(select(City)).one()
        assert city.name == "Greenville"  # fresh seed


def test_cli_status_does_not_seed(engine):
    exit_code = main(["--status"])
    assert exit_code == 0
    with Session(engine) as s:
        # --status must not write
        assert len(s.exec(select(City)).all()) == 0


def test_cli_status_after_seed(engine, caplog):
    import logging

    main([])
    with caplog.at_level(logging.INFO, logger="climate_tracker.seed_cli"):
        main(["--status"])
    messages = " ".join(r.getMessage() for r in caplog.records)
    assert "Greenville" in messages
    assert "actions=6" in messages
