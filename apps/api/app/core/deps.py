"""Cross-cutting FastAPI dependencies shared by feature routers."""

from typing import TypeVar
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, SQLModel

T = TypeVar("T", bound=SQLModel)


def get_or_404(
    session: Session,
    model: type[T],
    entity_id: UUID,
    label: str,
    *,
    filter_active: bool = False,
) -> T:
    """Fetch an entity by primary key or raise 404 with a friendly label.

    When ``filter_active`` is True, any entity exposing a non-null
    ``deleted_at`` attribute is treated as not-found.
    """
    entity = session.get(model, entity_id)
    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label} not found",
        )
    if filter_active and getattr(entity, "deleted_at", None) is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label} not found",
        )
    return entity
