"""Seed data for the Climate Action Tracker.

Six cities are loaded. Greenville keeps the figures from the original PDF
exercise; the others are demo-grade approximations meant to populate dashboards,
NOT real policy data.
"""

from __future__ import annotations

from typing import TypedDict

from sqlmodel import Session, delete, select

from .actions.models import Action
from .cities.models import City
from .core.enums import ActionStatus, Sector


class ActionSeed(TypedDict):
    title: str
    sector: Sector
    annual_reduction: float
    status: ActionStatus
    start_year: int


class CitySeed(TypedDict):
    name: str
    baseline_emissions: float
    target_year: int
    actions: list[ActionSeed]


CITIES: list[CitySeed] = [
    {
        "name": "Greenville",
        "baseline_emissions": 500_000,
        "target_year": 2035,
        "actions": [
            {"title": "Expand bike lane network",                  "sector": Sector.transport, "annual_reduction": 12_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Solar panel incentive program",             "sector": Sector.energy,    "annual_reduction": 45_000, "status": ActionStatus.in_progress, "start_year": 2023},
            {"title": "Municipal building retrofits",              "sector": Sector.buildings, "annual_reduction": 18_000, "status": ActionStatus.planned,     "start_year": 2026},
            {"title": "Organic waste composting program",          "sector": Sector.waste,     "annual_reduction":  8_000, "status": ActionStatus.completed,   "start_year": 2022},
            {"title": "Urban reforestation initiative",            "sector": Sector.land_use,  "annual_reduction": 15_000, "status": ActionStatus.planned,     "start_year": 2025},
            {"title": "EV fleet transition for public transit",    "sector": Sector.transport, "annual_reduction": 30_000, "status": ActionStatus.planned,     "start_year": 2026},
        ],
    },
    {
        "name": "São Paulo",
        "baseline_emissions": 18_500_000,
        "target_year": 2050,
        "actions": [
            {"title": "Metro line 6 expansion",                    "sector": Sector.transport, "annual_reduction": 450_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Rooftop solar mandate for new builds",      "sector": Sector.energy,    "annual_reduction": 320_000, "status": ActionStatus.in_progress, "start_year": 2025},
            {"title": "Cantareira watershed reforestation",        "sector": Sector.land_use,  "annual_reduction": 210_000, "status": ActionStatus.planned,     "start_year": 2026},
            {"title": "Methane capture at Bandeirantes landfill",  "sector": Sector.waste,     "annual_reduction": 180_000, "status": ActionStatus.completed,   "start_year": 2021},
            {"title": "Energy retrofit for municipal schools",     "sector": Sector.buildings, "annual_reduction":  90_000, "status": ActionStatus.planned,     "start_year": 2027},
        ],
    },
    {
        "name": "Nova York",
        "baseline_emissions": 50_000_000,
        "target_year": 2050,
        "actions": [
            {"title": "Local Law 97 building emissions caps",      "sector": Sector.buildings, "annual_reduction": 1_200_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Congestion pricing south of 60th St",       "sector": Sector.transport, "annual_reduction":   400_000, "status": ActionStatus.in_progress, "start_year": 2025},
            {"title": "Offshore wind procurement",                 "sector": Sector.energy,    "annual_reduction": 1_500_000, "status": ActionStatus.planned,     "start_year": 2027},
            {"title": "Organics curbside pickup citywide",         "sector": Sector.waste,     "annual_reduction":   220_000, "status": ActionStatus.in_progress, "start_year": 2024},
        ],
    },
    {
        "name": "Londres",
        "baseline_emissions": 27_000_000,
        "target_year": 2030,
        "actions": [
            {"title": "Ultra Low Emission Zone expansion",         "sector": Sector.transport, "annual_reduction": 380_000, "status": ActionStatus.completed,   "start_year": 2023},
            {"title": "Heat pump retrofit grants",                 "sector": Sector.buildings, "annual_reduction": 540_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Thames Tideway renewables",                 "sector": Sector.energy,    "annual_reduction": 260_000, "status": ActionStatus.planned,     "start_year": 2026},
            {"title": "Rewilding programme - Greater London",      "sector": Sector.land_use,  "annual_reduction":  80_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Borough-level food waste collection",       "sector": Sector.waste,     "annual_reduction":  95_000, "status": ActionStatus.planned,     "start_year": 2025},
        ],
    },
    {
        "name": "Tóquio",
        "baseline_emissions": 60_000_000,
        "target_year": 2050,
        "actions": [
            {"title": "Cap-and-trade for large buildings",         "sector": Sector.buildings, "annual_reduction": 900_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Hydrogen-fueled bus fleet",                 "sector": Sector.transport, "annual_reduction": 250_000, "status": ActionStatus.planned,     "start_year": 2027},
            {"title": "Rooftop solar on metropolitan facilities",  "sector": Sector.energy,    "annual_reduction": 410_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Urban heat island greening",                "sector": Sector.land_use,  "annual_reduction": 130_000, "status": ActionStatus.planned,     "start_year": 2026},
        ],
    },
    {
        "name": "Berlim",
        "baseline_emissions": 15_000_000,
        "target_year": 2045,
        "actions": [
            {"title": "District heating decarbonisation",          "sector": Sector.energy,    "annual_reduction": 360_000, "status": ActionStatus.in_progress, "start_year": 2025},
            {"title": "U-Bahn modernization program",              "sector": Sector.transport, "annual_reduction": 140_000, "status": ActionStatus.planned,     "start_year": 2027},
            {"title": "Mandatory facade insulation",               "sector": Sector.buildings, "annual_reduction": 280_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Tempelhofer Feld biodiversity",             "sector": Sector.land_use,  "annual_reduction":  40_000, "status": ActionStatus.completed,   "start_year": 2022},
            {"title": "Biogas from organic waste",                 "sector": Sector.waste,     "annual_reduction":  75_000, "status": ActionStatus.in_progress, "start_year": 2024},
        ],
    },
]


def seed(session: Session, *, reset: bool = False) -> list[City]:
    """Idempotently load CITIES. With reset=True, wipe everything first."""
    if reset:
        session.exec(delete(Action))  # type: ignore[arg-type]
        session.exec(delete(City))  # type: ignore[arg-type]
        session.commit()

    inserted: list[City] = []
    for entry in CITIES:
        existing = session.exec(
            select(City).where(City.name == entry["name"])
        ).first()
        if existing is not None:
            inserted.append(existing)
            continue
        city = City(
            name=entry["name"],
            baseline_emissions=entry["baseline_emissions"],
            target_year=entry["target_year"],
        )
        session.add(city)
        session.commit()
        session.refresh(city)
        for a in entry["actions"]:
            session.add(Action(city_id=city.id, **a))
        session.commit()
        session.refresh(city)
        inserted.append(city)
    return inserted


def seed_if_empty(session: Session) -> City:
    """Backwards-compat shim for callers that want the first city."""
    return seed(session, reset=False)[0]
