from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select

from ..auth.deps import require_admin
from ..cities.models import City
from ..core.db import get_session
from ..core.deps import get_or_404
from .models import Action
from .schemas import ActionCreate, ActionRead, ActionUpdate

router = APIRouter(tags=["actions"])


@router.get("/cities/{city_id}/actions", response_model=list[ActionRead])
def list_actions(city_id: UUID, session: Session = Depends(get_session)):
    get_or_404(session, City, city_id, "City")
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
    get_or_404(session, City, city_id, "City")
    action = Action(city_id=city_id, **payload.model_dump())
    session.add(action)
    session.commit()
    session.refresh(action)
    return action


@router.get("/actions/{action_id}", response_model=ActionRead)
def get_action(action_id: UUID, session: Session = Depends(get_session)):
    return get_or_404(session, Action, action_id, "Action")


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
    session.delete(action)
    session.commit()
    return None
