from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class CityBase(SQLModel):
    name: str
    baseline_emissions: float = Field(ge=0, description="Annual CO2 baseline in tons")
    target_year: int = Field(ge=1900, le=2100, description="Year to reach net zero")


class City(CityBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    actions: list["Action"] = Relationship(  # noqa: F821  (forward ref to actions.models.Action)
        back_populates="city",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
