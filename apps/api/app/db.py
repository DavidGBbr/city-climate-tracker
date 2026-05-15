from collections.abc import Generator

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings

_engine = None


def _build_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(url, pool_pre_ping=True)


def get_engine():
    global _engine
    if _engine is None:
        _engine = _build_engine(get_settings().database_url)
    return _engine


def set_engine(engine) -> None:
    """Override the module engine (used by tests)."""
    global _engine
    _engine = engine


def init_db() -> None:
    SQLModel.metadata.create_all(get_engine())


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
