from uuid import UUID

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..auth.deps import require_admin
from ..core.db import get_session
from ..core.deps import get_or_404
from .models import City
from .schemas import CityRead, CityUpdate

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=list[CityRead])
def list_cities(session: Session = Depends(get_session)):
    return session.exec(select(City).order_by(City.name)).all()


@router.get("/{city_id}", response_model=CityRead)
def get_city(city_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, City, city_id, "City")


@router.patch(
    "/{city_id}",
    response_model=CityRead,
    dependencies=[Depends(require_admin)],
)
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
