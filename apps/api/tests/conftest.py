from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.core import db as db_module
from app.core.db import get_session
from app.main import app
from app.cities.models import City


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
def client(engine) -> Iterator[TestClient]:
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
        # Detach so callers can read attributes after the session closes
        s.expunge(city)
        return city
