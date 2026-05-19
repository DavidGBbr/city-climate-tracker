from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from .cities.models import City


class Sector(str, Enum):
    transport = "transport"
    energy = "energy"
    buildings = "buildings"
    waste = "waste"
    land_use = "land use"


class ActionStatus(str, Enum):
    planned = "planned"
    in_progress = "in progress"
    completed = "completed"


class ActionBase(SQLModel):
    title: str
    sector: Sector
    annual_reduction: float = Field(ge=0, description="Estimated tons CO2/year")
    status: ActionStatus
    start_year: int = Field(ge=1900, le=2100)


class Action(ActionBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    city_id: UUID = Field(foreign_key="city.id", index=True)
    city: Optional[City] = Relationship(back_populates="actions")


class ActionCreate(ActionBase):
    pass


class ActionRead(ActionBase):
    id: UUID
    city_id: UUID


class ActionUpdate(SQLModel):
    title: Optional[str] = None
    sector: Optional[Sector] = None
    annual_reduction: Optional[float] = Field(default=None, ge=0)
    status: Optional[ActionStatus] = None
    start_year: Optional[int] = Field(default=None, ge=1900, le=2100)


class ActionDraft(ActionBase):
    """LLM-extracted action — not persisted, returned for admin review."""
