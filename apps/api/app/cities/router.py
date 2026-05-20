from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from ..auth.deps import require_admin
from ..core.config import Settings, get_settings
from ..core.db import get_session
from ..core.deps import get_or_404
from .models import City
from .queries import active_cities_stmt
from .schemas import CityCreate, CityRead, CityUpdate

router = APIRouter(prefix="/cities", tags=["cities"])


def require_admin_if_include_deleted(
    request: Request,
    include_deleted: bool = Query(False),
    settings: Settings = Depends(get_settings),
) -> bool:
    """Allow ?include_deleted=true only for authenticated admins."""
    if include_deleted:
        require_admin(request, settings)  # raises 401 if missing/invalid token
    return include_deleted


def _duplicate_name_exists(
    session: Session, name: str, *, exclude_id: UUID | None = None
) -> bool:
    stmt = select(City).where(func.lower(City.name) == name.lower())
    if exclude_id is not None:
        stmt = stmt.where(City.id != exclude_id)
    return session.exec(stmt).first() is not None


@router.get("", response_model=list[CityRead])
def list_cities(
    include_deleted: bool = Depends(require_admin_if_include_deleted),
    session: Session = Depends(get_session),
):
    return session.exec(active_cities_stmt(include_deleted=include_deleted)).all()


@router.get("/{city_id}", response_model=CityRead)
def get_city(
    city_id: UUID,
    include_deleted: bool = Depends(require_admin_if_include_deleted),
    session: Session = Depends(get_session),
):
    return get_or_404(
        session, City, city_id, "City", filter_active=not include_deleted
    )


@router.post(
    "",
    response_model=CityRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_city(payload: CityCreate, session: Session = Depends(get_session)):
    if _duplicate_name_exists(session, payload.name):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A city with that name already exists.",
        )
    city = City(**payload.model_dump())
    session.add(city)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A city with that name already exists.",
        )
    session.refresh(city)
    return city


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
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] is not None:
        if _duplicate_name_exists(session, data["name"], exclude_id=city.id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A city with that name already exists.",
            )
    for field, value in data.items():
        setattr(city, field, value)
    session.add(city)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A city with that name already exists.",
        )
    session.refresh(city)
    return city


@router.delete(
    "/{city_id}",
    response_model=CityRead,
    dependencies=[Depends(require_admin)],
)
def archive_city(city_id: UUID, session: Session = Depends(get_session)):
    city = get_or_404(session, City, city_id, "City")
    if city.deleted_at is None:
        city.deleted_at = datetime.utcnow()
        session.add(city)
        session.commit()
        session.refresh(city)
    return city


@router.post(
    "/{city_id}/restore",
    response_model=CityRead,
    dependencies=[Depends(require_admin)],
)
def restore_city(city_id: UUID, session: Session = Depends(get_session)):
    city = get_or_404(session, City, city_id, "City")
    city.deleted_at = None
    session.add(city)
    session.commit()
    session.refresh(city)
    return city
