from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import Field, SQLModel

from .models import CityBase


class CityRead(CityBase):
    id: UUID
    deleted_at: datetime | None = None


class CityCreate(CityBase):
    pass


class CityUpdate(SQLModel):
    name: Optional[str] = None
    baseline_emissions: Optional[float] = Field(default=None, ge=0)
    target_year: Optional[int] = Field(default=None, ge=1900, le=2100)
