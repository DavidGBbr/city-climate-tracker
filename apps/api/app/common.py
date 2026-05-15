"""Cross-cutting helpers shared by routers and services."""

from typing import TypeVar
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, SQLModel

T = TypeVar("T", bound=SQLModel)


def get_or_404(session: Session, model: type[T], entity_id: UUID, label: str) -> T:
    """Fetch an entity by primary key or raise 404 with a friendly label."""
    entity = session.get(model, entity_id)
    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label} not found",
        )
    return entity
