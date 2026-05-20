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
    settings = get_settings()
    engine = get_engine()
    if (
        settings.use_metadata_create_all
        or settings.database_url.startswith("sqlite")
        or engine.url.get_backend_name() == "sqlite"
    ):
        SQLModel.metadata.create_all(engine)
        return
    _run_alembic_upgrade()


def _run_alembic_upgrade() -> None:
    from pathlib import Path

    from alembic import command
    from alembic.config import Config

    ini_path = Path(__file__).resolve().parents[2] / "alembic.ini"
    cfg = Config(str(ini_path))
    cfg.set_main_option("script_location", str(ini_path.parent / "migrations"))
    cfg.set_main_option("sqlalchemy.url", get_settings().database_url)
    command.upgrade(cfg, "head")


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session
