from dataclasses import asdict
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..actions.models import Action
from ..cities.models import City
from ..core.db import get_session
from ..core.deps import get_or_404
from .service import build_summary

router = APIRouter(prefix="/cities", tags=["summary"])


@router.get("/{city_id}/summary")
def get_summary(
    city_id: UUID,
    as_of: int | None = None,
    session: Session = Depends(get_session),
):
    city = get_or_404(session, City, city_id, "City")
    actions = session.exec(select(Action).where(Action.city_id == city_id)).all()
    summary = build_summary(city, list(actions), as_of_year=as_of)
    return asdict(summary)
