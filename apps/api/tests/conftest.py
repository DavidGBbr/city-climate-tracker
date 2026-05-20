from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.auth.service import create_access_token
from app.cities.models import City
from app.core import db as db_module
from app.core.config import get_settings
from app.core.db import get_session
from app.main import app


@pytest.fixture
def engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    db_module.set_engine(engine)
    yield engine
    db_module.set_engine(None)


@pytest.fixture
def session(engine) -> Iterator[Session]:
    with Session(engine) as s:
        yield s


@pytest.fixture
def admin_token() -> str:
    token, _ = create_access_token(get_settings())
    return token


@pytest.fixture
def client(engine, admin_token) -> Iterator[TestClient]:
    """Authenticated client — all mutating routes pass require_admin."""

    def _override():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = _override
    with TestClient(app, headers={"Authorization": f"Bearer {admin_token}"}) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def anon_client(engine) -> Iterator[TestClient]:
    """Unauthenticated client — for testing 401 on protected routes."""

    def _override():
        with Session(engine) as s:
            yield s

    app.dependency_overrides[get_session] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_city(client, engine) -> City:
    """Greenville is seeded by the FastAPI lifespan; resolve its UUID for tests."""
    with Session(engine) as s:
        city = s.exec(select(City)).one()
        s.expunge(city)
        return city
