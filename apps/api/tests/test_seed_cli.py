"""Tests for the standalone seed CLI and the seed() function."""


def test_seed_loads_six_cities(client, session):
    from sqlmodel import select
    from app.cities.models import City

    names = {c.name for c in session.exec(select(City)).all()}
    assert names == {"Berlim", "Greenville", "Londres", "Nova York", "São Paulo", "Tóquio"}


def test_seed_is_idempotent(client, session):
    from sqlmodel import select
    from app.cities.models import City
    from app.seed import seed

    before = len(session.exec(select(City)).all())
    seed(session, reset=False)
    after = len(session.exec(select(City)).all())
    assert before == after == 6


def test_seed_cli_reset_flag(client, session):
    from sqlmodel import select
    from app.cities.models import City
    from app.actions.models import Action
    from app.seed_cli import main

    # Add a junk city; --reset should wipe it.
    session.add(City(name="JunkTown", baseline_emissions=1.0, target_year=2050))
    session.commit()

    assert main(["--reset"]) == 0

    names = {c.name for c in session.exec(select(City)).all()}
    assert "JunkTown" not in names
    assert len(names) == 6
    assert len(session.exec(select(Action)).all()) > 0
