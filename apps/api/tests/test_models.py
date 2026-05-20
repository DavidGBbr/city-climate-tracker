from sqlmodel import select

from app.actions.models import Action
from app.cities.models import City
from app.core.enums import ActionStatus, Sector
from app.seed import seed_if_empty


def test_city_action_roundtrip(session):
    city = City(name="Testville", baseline_emissions=100000, target_year=2040)
    session.add(city)
    session.commit()
    session.refresh(city)

    session.add(
        Action(
            city_id=city.id,
            title="Bike lanes",
            sector=Sector.transport,
            annual_reduction=1234.5,
            status=ActionStatus.planned,
            start_year=2025,
        )
    )
    session.commit()

    fetched = session.exec(select(City).where(City.id == city.id)).one()
    assert fetched.name == "Testville"
    assert len(fetched.actions) == 1
    action = fetched.actions[0]
    assert action.sector == Sector.transport
    assert action.status == ActionStatus.planned
    assert action.annual_reduction == 1234.5


def test_sector_uses_land_use_with_space():
    """Sector enum stores the PDF's 'land use' (with space), not 'land_use'."""
    assert Sector.land_use.value == "land use"


def test_seed_greenville(session):
    city = seed_if_empty(session)
    assert city.name == "Greenville"
    assert city.baseline_emissions == 500000
    assert city.target_year == 2035
    assert len(city.actions) == 6
    titles = {a.title for a in city.actions}
    assert "Expand bike lane network" in titles
    assert "Solar panel incentive program" in titles


def test_seed_is_idempotent(session):
    first = seed_if_empty(session)
    second = seed_if_empty(session)
    assert first.id == second.id
    assert len(session.exec(select(City)).all()) == 6
