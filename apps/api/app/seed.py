"""Greenville sample data from the OEF exercise PDF."""

from sqlmodel import Session, select

from .actions.models import Action
from .cities.models import City
from .core.enums import ActionStatus, Sector

GREENVILLE = {
    "name": "Greenville",
    "baseline_emissions": 500000,
    "target_year": 2035,
}

ACTIONS = [
    {
        "title": "Expand bike lane network",
        "sector": Sector.transport,
        "annual_reduction": 12000,
        "status": ActionStatus.in_progress,
        "start_year": 2024,
    },
    {
        "title": "Solar panel incentive program",
        "sector": Sector.energy,
        "annual_reduction": 45000,
        "status": ActionStatus.in_progress,
        "start_year": 2023,
    },
    {
        "title": "Municipal building retrofits",
        "sector": Sector.buildings,
        "annual_reduction": 18000,
        "status": ActionStatus.planned,
        "start_year": 2026,
    },
    {
        "title": "Organic waste composting program",
        "sector": Sector.waste,
        "annual_reduction": 8000,
        "status": ActionStatus.completed,
        "start_year": 2022,
    },
    {
        "title": "Urban reforestation initiative",
        "sector": Sector.land_use,
        "annual_reduction": 15000,
        "status": ActionStatus.planned,
        "start_year": 2025,
    },
    {
        "title": "EV fleet transition for public transit",
        "sector": Sector.transport,
        "annual_reduction": 30000,
        "status": ActionStatus.planned,
        "start_year": 2026,
    },
]


def seed_if_empty(session: Session) -> City:
    existing = session.exec(select(City)).first()
    if existing:
        return existing

    city = City(**GREENVILLE)
    session.add(city)
    session.commit()
    session.refresh(city)

    for data in ACTIONS:
        session.add(Action(city_id=city.id, **data))
    session.commit()
    session.refresh(city)
    return city
