from typing import Optional
from uuid import UUID

from sqlmodel import Field, SQLModel

from ..core.enums import ActionStatus, Sector
from .models import ActionBase


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
