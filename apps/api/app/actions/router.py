from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..auth.deps import require_admin
from ..cities.models import City
from ..core.db import get_session
from ..core.deps import get_or_404
from .models import Action
from .schemas import ActionCreate, ActionRead, ActionUpdate

router = APIRouter(tags=["actions"])


def _ensure_city_active(session: Session, city_id: UUID) -> City:
    """Resolve the city; 409 if it is archived."""
    city = get_or_404(session, City, city_id, "City")
    if city.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="City is archived; restore it first.",
        )
    return city


@router.get("/cities/{city_id}/actions", response_model=list[ActionRead])
def list_actions(city_id: UUID, session: Session = Depends(get_session)):
    get_or_404(session, City, city_id, "City", filter_active=True)
    return session.exec(
        select(Action).where(Action.city_id == city_id).order_by(Action.start_year)
    ).all()


@router.post(
    "/cities/{city_id}/actions",
    response_model=ActionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_action(
    city_id: UUID,
    payload: ActionCreate,
    session: Session = Depends(get_session),
):
    _ensure_city_active(session, city_id)
    action = Action(city_id=city_id, **payload.model_dump())
    session.add(action)
    session.commit()
    session.refresh(action)
    return action


@router.get("/actions/{action_id}", response_model=ActionRead)
def get_action(action_id: UUID, session: Session = Depends(get_session)):
    action = get_or_404(session, Action, action_id, "Action")
    # Hide actions whose parent city has been archived.
    get_or_404(session, City, action.city_id, "Action", filter_active=True)
    return action


@router.patch(
    "/actions/{action_id}",
    response_model=ActionRead,
    dependencies=[Depends(require_admin)],
)
def update_action(
    action_id: UUID,
    payload: ActionUpdate,
    session: Session = Depends(get_session),
):
    action = get_or_404(session, Action, action_id, "Action")
    _ensure_city_active(session, action.city_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(action, field, value)
    session.add(action)
    session.commit()
    session.refresh(action)
    return action


@router.delete(
    "/actions/{action_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_action(action_id: UUID, session: Session = Depends(get_session)):
    action = get_or_404(session, Action, action_id, "Action")
    _ensure_city_active(session, action.city_id)
    session.delete(action)
    session.commit()
    return None
