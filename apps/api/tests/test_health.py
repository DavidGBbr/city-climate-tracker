def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "city-climate-action-tracker"
    assert body["status"] == "ok"


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["db"] == "ok"


def test_init_db_uses_create_all_for_sqlite(monkeypatch):
    """init_db must not import or invoke alembic when DATABASE_URL is sqlite."""
    from app.core import db
    from app.core.config import get_settings

    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    get_settings.cache_clear()
    db.set_engine(None)
    try:
        db.init_db()  # Must succeed without raising.
    finally:
        db.set_engine(None)
        get_settings.cache_clear()
