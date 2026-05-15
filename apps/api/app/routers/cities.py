from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..common import get_or_404
from ..db import get_session
from ..models import City, CityRead, CityUpdate

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("/{city_id}", response_model=CityRead)
def get_city(city_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, City, city_id, "City")


@router.patch("/{city_id}", response_model=CityRead)
def update_city(
    city_id: UUID,
    payload: CityUpdate,
    session: Session = Depends(get_session),
):
    city = get_or_404(session, City, city_id, "City")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(city, field, value)
    session.add(city)
    session.commit()
    session.refresh(city)
    return city
