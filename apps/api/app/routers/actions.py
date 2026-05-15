from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..db import get_session
from ..models import Action, ActionCreate, ActionRead, ActionUpdate, City

router = APIRouter(tags=["actions"])


def _action_or_404(session: Session, action_id: int) -> Action:
    action = session.get(Action, action_id)
    if action is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")
    return action


def _city_or_404(session: Session, city_id: int) -> City:
    city = session.get(City, city_id)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    return city


@router.get("/cities/{city_id}/actions", response_model=list[ActionRead])
def list_actions(city_id: int, session: Session = Depends(get_session)):
    _city_or_404(session, city_id)
    return session.exec(
        select(Action).where(Action.city_id == city_id).order_by(Action.start_year)
    ).all()


@router.post(
    "/cities/{city_id}/actions",
    response_model=ActionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_action(
    city_id: int,
    payload: ActionCreate,
    session: Session = Depends(get_session),
):
    _city_or_404(session, city_id)
    action = Action(city_id=city_id, **payload.model_dump())
    session.add(action)
    session.commit()
    session.refresh(action)
    return action


@router.get("/actions/{action_id}", response_model=ActionRead)
def get_action(action_id: int, session: Session = Depends(get_session)):
    return _action_or_404(session, action_id)


@router.patch("/actions/{action_id}", response_model=ActionRead)
def update_action(
    action_id: int,
    payload: ActionUpdate,
    session: Session = Depends(get_session),
):
    action = _action_or_404(session, action_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(action, field, value)
    session.add(action)
    session.commit()
    session.refresh(action)
    return action


@router.delete("/actions/{action_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action(action_id: int, session: Session = Depends(get_session)):
    action = _action_or_404(session, action_id)
    session.delete(action)
    session.commit()
    return None
