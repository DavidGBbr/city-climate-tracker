from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from ..cities.models import City
from ..core.enums import ActionStatus, Sector


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
