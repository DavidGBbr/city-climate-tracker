from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from ..db import get_session
from ..models import City, CityRead, CityUpdate

router = APIRouter(prefix="/cities", tags=["cities"])


def _get_or_404(session: Session, city_id: int) -> City:
    city = session.get(City, city_id)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    return city


@router.get("/{city_id}", response_model=CityRead)
def get_city(city_id: int, session: Session = Depends(get_session)):
    return _get_or_404(session, city_id)


@router.patch("/{city_id}", response_model=CityRead)
def update_city(
    city_id: int,
    payload: CityUpdate,
    session: Session = Depends(get_session),
):
    city = _get_or_404(session, city_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(city, field, value)
    session.add(city)
    session.commit()
    session.refresh(city)
    return city
