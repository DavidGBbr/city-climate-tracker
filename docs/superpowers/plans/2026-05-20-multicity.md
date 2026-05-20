# Multi-city Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-city Climate Action Tracker into a multi-city product (public seletor + admin city CRUD with soft-delete), seed 6 cities, and introduce Alembic for schema migrations. UI copy stays in English.

**Architecture:** Soft-delete via `City.deleted_at`. Public queries filter to `deleted_at IS NULL`; admin can opt into archived rows with `?include_deleted=true`. Selected city is local React state in `PublicDashboard` and `AdminWorkspace` (no URL/localStorage). Alembic introduced with a baseline migration matching current schema, then a migration that adds the soft-delete column + case-insensitive unique index on `City.name`.

**Tech Stack:** FastAPI + SQLModel + Alembic + Postgres (API), Next.js 14 + SWR + Zod (web), pytest, uv.

**Repo paths:**
- API: `apps/api/` (run commands with `cd apps/api` first)
- Web: `apps/web/`
- Compose: `docker-compose.yml`

**Convention:** Commit after every task. Use Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, `refactor:`). All commits include the `Co-Authored-By` trailer the team uses.

---

## File Map

**Create**
- `apps/api/alembic.ini`
- `apps/api/migrations/env.py`
- `apps/api/migrations/script.py.mako`
- `apps/api/migrations/versions/0001_initial.py`
- `apps/api/migrations/versions/0002_city_soft_delete.py`
- `apps/api/app/cities/queries.py` (soft-delete query helpers)
- `apps/api/tests/test_migrations.py`
- `apps/web/features/cities/components/CitySelector.tsx`
- `apps/web/features/cities/components/NewCityModal.tsx`
- `apps/web/features/cities/components/ArchiveCityButton.tsx`

**Modify**
- `apps/api/pyproject.toml` (add `alembic`)
- `apps/api/app/cities/models.py` (add `deleted_at`)
- `apps/api/app/cities/schemas.py` (add `CityCreate`, expose `deleted_at` on `CityRead`)
- `apps/api/app/cities/router.py` (POST, DELETE, restore, include_deleted)
- `apps/api/app/actions/router.py` (block mutations on archived city)
- `apps/api/app/summary/router.py` (404 on archived)
- `apps/api/app/core/db.py` (run `alembic upgrade head` in `init_db` when not in-memory)
- `apps/api/app/core/deps.py` (extend `get_or_404` with `filter_active`)
- `apps/api/app/seed.py` (6 cities, idempotent by name, `reset` param)
- `apps/api/app/seed_cli.py` (wire to new `seed()` signature)
- `apps/api/app/main.py` (lifespan calls new `seed`)
- `apps/api/tests/conftest.py` (multi-city fixtures)
- `apps/api/tests/test_cities.py` (CRUD + soft delete)
- `apps/api/tests/test_actions.py` (mutations on archived → 409)
- `apps/api/tests/test_summary.py` (archived → 404)
- `apps/api/tests/test_seed_cli.py` (6 cities, --reset)
- `apps/api/Dockerfile` (entrypoint runs migrations)
- `apps/web/lib/schemas/city.ts` (add `deleted_at`, `CityCreateSchema`)
- `apps/web/lib/cache.ts` (KEYS.adminCities)
- `apps/web/features/cities/hooks.ts` (delete `useDefaultCity`, add `useAdminCities`, `useCreateCity`, etc.)
- `apps/web/features/dashboard/components/PublicDashboard.tsx` (consume selected city via prop)
- `apps/web/features/cities/components/CitySettings.tsx` (accept `city` prop, archived banner)
- `apps/web/features/actions/components/ActionsManager.tsx` (accept `city`/`cityId` prop, archived banner)
- `apps/web/app/(public)/page.tsx` (render selector + dashboard tree)
- `apps/web/app/(admin)/admin/_components/AdminWorkspace.tsx` (selector + admin controls)
- `README.md` and `.env.example` if Alembic env vars needed

---

## Task 1: Add Alembic dependency and initialize migrations directory

**Files:**
- Modify: `apps/api/pyproject.toml`
- Create: `apps/api/alembic.ini`
- Create: `apps/api/migrations/env.py`
- Create: `apps/api/migrations/script.py.mako`
- Create: `apps/api/migrations/versions/.gitkeep`

- [ ] **Step 1: Add alembic to dependencies**

Edit `apps/api/pyproject.toml`, append `"alembic==1.13.3",` to the `dependencies` list (after `pyjwt==2.9.0`).

- [ ] **Step 2: Sync dependencies**

```bash
cd apps/api
uv sync
```

Expected: `alembic` installed; `uv.lock` updated.

- [ ] **Step 3: Initialize Alembic skeleton**

```bash
cd apps/api
uv run alembic init -t generic migrations
```

Expected: Creates `apps/api/alembic.ini` and `apps/api/migrations/` (with `env.py`, `script.py.mako`, `versions/`). If `versions/` is empty, add a `.gitkeep`.

- [ ] **Step 4: Configure alembic.ini**

Replace the `sqlalchemy.url` line in `apps/api/alembic.ini` with a blank URL (we set it from env.py):

```
sqlalchemy.url =
```

Also set `script_location = migrations` (default is fine if already there) and `prepend_sys_path = .`.

- [ ] **Step 5: Wire env.py to settings and SQLModel metadata**

Overwrite `apps/api/migrations/env.py` with:

```python
from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

# Import every model module so SQLModel.metadata is populated.
from app.actions import models as _actions_models  # noqa: F401
from app.cities import models as _cities_models  # noqa: F401
from app.core.config import get_settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", get_settings().database_url)

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 6: Verify alembic recognizes the config**

```bash
cd apps/api
uv run alembic current
```

Expected: Prints nothing (no migrations applied yet) and exits 0. If it errors on DB connectivity, that's fine — we'll generate offline next.

- [ ] **Step 7: Commit**

```bash
git add apps/api/pyproject.toml apps/api/uv.lock apps/api/alembic.ini apps/api/migrations/
git commit -m "$(cat <<'EOF'
chore(api): add alembic and initialize migrations skeleton

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Author the baseline migration (0001_initial)

**Files:**
- Create: `apps/api/migrations/versions/0001_initial.py`

- [ ] **Step 1: Write the baseline migration by hand**

Create `apps/api/migrations/versions/0001_initial.py` with:

```python
"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-20
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "city",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("baseline_emissions", sa.Float(), nullable=False),
        sa.Column("target_year", sa.Integer(), nullable=False),
    )
    op.create_table(
        "action",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "city_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("city.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("sector", sa.String(), nullable=False),
        sa.Column("annual_reduction", sa.Float(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("start_year", sa.Integer(), nullable=False),
    )
    op.create_index("ix_action_city_id", "action", ["city_id"])


def downgrade() -> None:
    op.drop_index("ix_action_city_id", table_name="action")
    op.drop_table("action")
    op.drop_table("city")
```

- [ ] **Step 2: Apply migration against the dev Postgres**

```bash
cd apps/api
docker compose -f ../../docker-compose.yml up -d postgres
DATABASE_URL=postgresql+psycopg://climate:climate@localhost:5432/climate_tracker \
  uv run alembic upgrade head
```

Expected: Output ends with `Running upgrade -> 0001_initial`. If the database already has tables from a previous run, drop them first with:

```bash
docker compose -f ../../docker-compose.yml down -v
docker compose -f ../../docker-compose.yml up -d postgres
```

- [ ] **Step 3: Verify the schema matches**

```bash
docker compose -f ../../docker-compose.yml exec postgres psql -U climate -d climate_tracker -c "\d city" -c "\d action"
```

Expected: Both tables exist with the columns above.

- [ ] **Step 4: Commit**

```bash
git add apps/api/migrations/versions/0001_initial.py
git commit -m "$(cat <<'EOF'
feat(api): baseline alembic migration matching current schema

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Switch init_db to run Alembic in non-test environments

**Files:**
- Modify: `apps/api/app/core/db.py`
- Modify: `apps/api/app/core/config.py`

- [ ] **Step 1: Add a flag to settings**

Edit `apps/api/app/core/config.py`, add to `Settings`:

```python
    use_metadata_create_all: bool = False
```

(Tests will set this to `True`; production stays `False`.)

- [ ] **Step 2: Update init_db to run Alembic**

Edit `apps/api/app/core/db.py`. Replace `init_db` with:

```python
def init_db() -> None:
    settings = get_settings()
    if settings.use_metadata_create_all or settings.database_url.startswith("sqlite"):
        SQLModel.metadata.create_all(get_engine())
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
```

Add the import at the top:

```python
from .config import get_settings
```

(it's already imported — keep one).

- [ ] **Step 3: Add a smoke test for the in-memory path**

Add to `apps/api/tests/test_health.py` (or create `test_db_bootstrap.py` if more appropriate). For TDD, write the failing test first:

```python
def test_init_db_uses_create_all_for_sqlite(monkeypatch, tmp_path):
    from app.core import db
    from app.core.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    db.set_engine(None)
    db.init_db()  # Must not import alembic, must not raise.
    db.set_engine(None)
    get_settings.cache_clear()
```

- [ ] **Step 4: Run the failing test, then make it pass**

```bash
cd apps/api
uv run pytest tests/test_health.py::test_init_db_uses_create_all_for_sqlite -v
```

Expected: PASS after the changes in steps 1-2.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/core/db.py apps/api/app/core/config.py apps/api/tests/test_health.py
git commit -m "$(cat <<'EOF'
feat(api): run alembic on startup for non-sqlite engines

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Add `deleted_at` to City model + migration 0002

**Files:**
- Modify: `apps/api/app/cities/models.py`
- Create: `apps/api/migrations/versions/0002_city_soft_delete.py`

- [ ] **Step 1: Update the City model**

Replace `apps/api/app/cities/models.py` with:

```python
from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel


class CityBase(SQLModel):
    name: str
    baseline_emissions: float = Field(ge=0, description="Annual CO2 baseline in tons")
    target_year: int = Field(ge=1900, le=2100, description="Year to reach net zero")


class City(CityBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    deleted_at: datetime | None = Field(default=None, index=True)
    actions: list["Action"] = Relationship(  # noqa: F821
        back_populates="city",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
```

- [ ] **Step 2: Write migration 0002**

Create `apps/api/migrations/versions/0002_city_soft_delete.py`:

```python
"""city soft delete + case-insensitive unique name

Revision ID: 0002_city_soft_delete
Revises: 0001_initial
Create Date: 2026-05-20
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_city_soft_delete"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("city", sa.Column("deleted_at", sa.DateTime(), nullable=True))
    op.create_index("ix_city_deleted_at", "city", ["deleted_at"])
    op.create_index(
        "ux_city_name_lower",
        "city",
        [sa.text("lower(name)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ux_city_name_lower", table_name="city")
    op.drop_index("ix_city_deleted_at", table_name="city")
    op.drop_column("city", "deleted_at")
```

- [ ] **Step 3: Apply migration and verify**

```bash
cd apps/api
DATABASE_URL=postgresql+psycopg://climate:climate@localhost:5432/climate_tracker \
  uv run alembic upgrade head
docker compose -f ../../docker-compose.yml exec postgres psql -U climate -d climate_tracker -c "\d city"
```

Expected: `deleted_at` column present, `ix_city_deleted_at` and `ux_city_name_lower` indexes listed.

- [ ] **Step 4: Verify downgrade works**

```bash
cd apps/api
DATABASE_URL=postgresql+psycopg://climate:climate@localhost:5432/climate_tracker \
  uv run alembic downgrade -1
DATABASE_URL=postgresql+psycopg://climate:climate@localhost:5432/climate_tracker \
  uv run alembic upgrade head
```

Expected: Both succeed; final state matches head.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/cities/models.py apps/api/migrations/versions/0002_city_soft_delete.py
git commit -m "$(cat <<'EOF'
feat(api): add City.deleted_at + case-insensitive unique name index

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add soft-delete query helpers and extend `get_or_404`

**Files:**
- Create: `apps/api/app/cities/queries.py`
- Modify: `apps/api/app/core/deps.py`

- [ ] **Step 1: Write a failing test for the helper**

Add to `apps/api/tests/test_cities.py` (top of file if needed):

```python
def test_active_cities_stmt_excludes_archived(session):
    from datetime import datetime
    from app.cities.models import City
    from app.cities.queries import active_cities_stmt

    alive = City(name="Alive", baseline_emissions=1.0, target_year=2050)
    dead = City(name="Dead", baseline_emissions=1.0, target_year=2050,
                deleted_at=datetime.utcnow())
    session.add(alive); session.add(dead); session.commit()

    rows = list(session.exec(active_cities_stmt()).all())
    assert [c.name for c in rows] == ["Alive"]

    rows_all = list(session.exec(active_cities_stmt(include_deleted=True)).all())
    assert {c.name for c in rows_all} == {"Alive", "Dead"}
```

- [ ] **Step 2: Run and verify it fails**

```bash
cd apps/api
uv run pytest tests/test_cities.py::test_active_cities_stmt_excludes_archived -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'app.cities.queries'`.

- [ ] **Step 3: Implement the helper**

Create `apps/api/app/cities/queries.py`:

```python
from sqlmodel import select

from .models import City


def active_cities_stmt(include_deleted: bool = False):
    stmt = select(City)
    if not include_deleted:
        stmt = stmt.where(City.deleted_at.is_(None))
    return stmt.order_by(City.name)
```

- [ ] **Step 4: Extend get_or_404 with `filter_active`**

Update `apps/api/app/core/deps.py`:

```python
"""Cross-cutting FastAPI dependencies shared by feature routers."""

from typing import TypeVar
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, SQLModel

from ..cities.models import City

T = TypeVar("T", bound=SQLModel)


def get_or_404(
    session: Session,
    model: type[T],
    entity_id: UUID,
    label: str,
    *,
    filter_active: bool = False,
) -> T:
    """Fetch an entity by primary key or raise 404 with a friendly label.

    When ``filter_active`` is True and ``model`` is City, soft-deleted rows
    are treated as not-found.
    """
    entity = session.get(model, entity_id)
    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label} not found",
        )
    if filter_active and isinstance(entity, City) and entity.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{label} not found",
        )
    return entity
```

- [ ] **Step 5: Run the test and confirm it passes**

```bash
cd apps/api
uv run pytest tests/test_cities.py::test_active_cities_stmt_excludes_archived -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/cities/queries.py apps/api/app/core/deps.py apps/api/tests/test_cities.py
git commit -m "$(cat <<'EOF'
feat(api): soft-delete query helpers + filter_active flag on get_or_404

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: City router — create, soft-delete, restore, include_deleted

**Files:**
- Modify: `apps/api/app/cities/schemas.py`
- Modify: `apps/api/app/cities/router.py`
- Modify: `apps/api/tests/test_cities.py`

- [ ] **Step 1: Add new schemas**

Replace `apps/api/app/cities/schemas.py` with:

```python
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import Field, SQLModel

from .models import CityBase


class CityRead(CityBase):
    id: UUID
    deleted_at: datetime | None = None


class CityCreate(CityBase):
    pass


class CityUpdate(SQLModel):
    name: Optional[str] = None
    baseline_emissions: Optional[float] = Field(default=None, ge=0)
    target_year: Optional[int] = Field(default=None, ge=1900, le=2100)
```

- [ ] **Step 2: Write the failing tests for the new endpoints**

Append to `apps/api/tests/test_cities.py`:

```python
def test_list_cities_excludes_archived(client, session, admin_token):
    from datetime import datetime
    from app.cities.models import City

    archived = City(name="Ghost", baseline_emissions=1.0, target_year=2050,
                    deleted_at=datetime.utcnow())
    session.add(archived); session.commit()

    body = client.get("/cities").json()
    assert all(c["name"] != "Ghost" for c in body)

    body_admin = client.get(
        "/cities?include_deleted=true",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()
    assert any(c["name"] == "Ghost" for c in body_admin)


def test_create_city_admin(client):
    resp = client.post(
        "/cities",
        json={"name": "Atlantis", "baseline_emissions": 100.0, "target_year": 2050},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Atlantis"
    assert body["deleted_at"] is None


def test_create_city_duplicate_case_insensitive(client):
    client.post("/cities", json={"name": "Atlantis", "baseline_emissions": 1.0, "target_year": 2050})
    resp = client.post(
        "/cities",
        json={"name": "atlantis", "baseline_emissions": 1.0, "target_year": 2050},
    )
    assert resp.status_code == 409


def test_create_city_requires_admin(anon_client):
    resp = anon_client.post(
        "/cities",
        json={"name": "X", "baseline_emissions": 1.0, "target_year": 2050},
    )
    assert resp.status_code in (401, 403)


def test_soft_delete_city_hides_from_public_list(client, seeded_city):
    resp = client.delete(f"/cities/{seeded_city.id}")
    assert resp.status_code == 204
    body = client.get("/cities").json()
    assert all(c["id"] != str(seeded_city.id) for c in body)


def test_soft_delete_is_idempotent(client, seeded_city):
    assert client.delete(f"/cities/{seeded_city.id}").status_code == 204
    assert client.delete(f"/cities/{seeded_city.id}").status_code == 204


def test_get_archived_city_404_public_but_admin_with_flag(client, seeded_city, admin_token):
    client.delete(f"/cities/{seeded_city.id}")
    assert client.get(f"/cities/{seeded_city.id}").status_code == 404
    resp = client.get(
        f"/cities/{seeded_city.id}?include_deleted=true",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200


def test_restore_city(client, seeded_city):
    client.delete(f"/cities/{seeded_city.id}")
    resp = client.post(f"/cities/{seeded_city.id}/restore")
    assert resp.status_code == 200
    assert resp.json()["deleted_at"] is None
    body = client.get("/cities").json()
    assert any(c["id"] == str(seeded_city.id) for c in body)


def test_include_deleted_requires_admin(anon_client):
    resp = anon_client.get("/cities?include_deleted=true")
    assert resp.status_code in (401, 403)
```

- [ ] **Step 3: Run them, confirm failures**

```bash
cd apps/api
uv run pytest tests/test_cities.py -v
```

Expected: Each new test fails with 404/405/501-style errors.

- [ ] **Step 3.5: Update soft-delete tests to match the chosen response shape**

The endpoint will return the archived `CityRead` (200) instead of 204, so the test from Step 2 needs to be adjusted before implementation:

```python
def test_soft_delete_city_hides_from_public_list(client, seeded_city):
    resp = client.delete(f"/cities/{seeded_city.id}")
    assert resp.status_code == 200
    assert resp.json()["deleted_at"] is not None
    body = client.get("/cities").json()
    assert all(c["id"] != str(seeded_city.id) for c in body)


def test_soft_delete_is_idempotent(client, seeded_city):
    first = client.delete(f"/cities/{seeded_city.id}").json()
    second = client.delete(f"/cities/{seeded_city.id}").json()
    assert first["deleted_at"] == second["deleted_at"]
```

- [ ] **Step 4: Implement the router**

`require_admin` (in `app/auth/deps.py`) is a FastAPI dependency that resolves via `Depends(require_admin)` and takes a `Request` + settings. To gate `include_deleted=true` per-request without requiring auth on the public path, we introduce one small dependency that always runs and conditionally calls `require_admin`.

Replace `apps/api/app/cities/router.py` with:

```python
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from ..auth.deps import require_admin
from ..core.config import Settings, get_settings
from ..core.db import get_session
from ..core.deps import get_or_404
from .models import City
from .queries import active_cities_stmt
from .schemas import CityCreate, CityRead, CityUpdate

router = APIRouter(prefix="/cities", tags=["cities"])


def require_admin_if_include_deleted(
    include_deleted: bool = Query(False),
    request: Request = None,  # type: ignore[assignment]
    settings: Settings = Depends(get_settings),
) -> bool:
    """Allow ?include_deleted=true only for authenticated admins."""
    if include_deleted:
        require_admin(request, settings)  # raises 401 if missing/invalid token
    return include_deleted


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
    for field, value in payload.model_dump(exclude_unset=True).items():
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
```

- [ ] **Step 5: Run all city tests**

```bash
cd apps/api
uv run pytest tests/test_cities.py -v
```

Expected: All pass. Iterate on the include_deleted admin gating if needed by reading `app/auth/deps.py` and matching its pattern (you may need to model the gate as a custom dependency rather than a function call).

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/cities/router.py apps/api/app/cities/schemas.py apps/api/tests/test_cities.py
git commit -m "$(cat <<'EOF'
feat(api): city create/archive/restore endpoints with soft delete

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Block mutations on archived cities (actions + summary)

**Files:**
- Modify: `apps/api/app/actions/router.py`
- Modify: `apps/api/app/summary/router.py`
- Modify: `apps/api/tests/test_actions.py`
- Modify: `apps/api/tests/test_summary.py`

- [ ] **Step 1: Write failing tests**

Append to `apps/api/tests/test_actions.py`:

```python
def test_create_action_on_archived_city_409(client, seeded_city):
    client.delete(f"/cities/{seeded_city.id}")
    resp = client.post(
        f"/cities/{seeded_city.id}/actions",
        json={
            "title": "Should fail",
            "sector": "transport",
            "annual_reduction": 100,
            "status": "planned",
            "start_year": 2030,
        },
    )
    assert resp.status_code == 409


def test_list_actions_on_archived_city_404(client, seeded_city):
    client.delete(f"/cities/{seeded_city.id}")
    resp = client.get(f"/cities/{seeded_city.id}/actions")
    assert resp.status_code == 404
```

Append to `apps/api/tests/test_summary.py`:

```python
def test_summary_on_archived_city_404(client, seeded_city):
    client.delete(f"/cities/{seeded_city.id}")
    resp = client.get(f"/cities/{seeded_city.id}/summary")
    assert resp.status_code == 404
```

- [ ] **Step 2: Run, confirm failures**

```bash
cd apps/api
uv run pytest tests/test_actions.py tests/test_summary.py -v
```

- [ ] **Step 3: Update actions router**

In `apps/api/app/actions/router.py`:

- Every `get_or_404(session, City, city_id, "City")` call in **read** endpoints passes `filter_active=True`.
- In `create_action` (and any other mutation that takes `city_id` directly), after fetching the city, raise 409 if archived:

```python
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
    city = get_or_404(session, City, city_id, "City")
    if city.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="City is archived; restore it to add actions.")
    action = Action(city_id=city_id, **payload.model_dump())
    session.add(action); session.commit(); session.refresh(action)
    return action
```

Add `from fastapi import HTTPException, status` if not already present.

Apply the same archived check to `update_action` and `delete_action` after resolving the parent city via `action.city_id`:

```python
city = get_or_404(session, City, action.city_id, "City")
if city.deleted_at is not None:
    raise HTTPException(status_code=409, detail="City is archived; restore it first.")
```

For `list_actions` and `get_action`, switch to `filter_active=True`.

- [ ] **Step 4: Update summary router**

In `apps/api/app/summary/router.py`, change the city lookup to `filter_active=True`:

```python
city = get_or_404(session, City, city_id, "City", filter_active=True)
```

- [ ] **Step 5: Run all tests, confirm pass**

```bash
cd apps/api
uv run pytest tests/test_actions.py tests/test_summary.py -v
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/actions/router.py apps/api/app/summary/router.py apps/api/tests/test_actions.py apps/api/tests/test_summary.py
git commit -m "$(cat <<'EOF'
feat(api): block action mutations and hide summary on archived cities

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Rewrite seed for 6 cities with idempotency + reset

**Files:**
- Modify: `apps/api/app/seed.py`
- Modify: `apps/api/app/seed_cli.py`
- Modify: `apps/api/app/main.py`
- Modify: `apps/api/tests/test_seed_cli.py`
- Modify: `apps/api/tests/conftest.py`

- [ ] **Step 1: Author the new seed module**

Replace `apps/api/app/seed.py` with the data below. The action lists are demo-grade fictional figures; comment that explicitly.

```python
"""Seed data for the Climate Action Tracker.

Six cities are loaded. Greenville keeps the figures from the original PDF
exercise; the others are demo-grade approximations meant to populate dashboards,
NOT real policy data.
"""

from __future__ import annotations

from typing import TypedDict

from sqlmodel import Session, delete, select

from .actions.models import Action
from .cities.models import City
from .core.enums import ActionStatus, Sector


class ActionSeed(TypedDict):
    title: str
    sector: Sector
    annual_reduction: float
    status: ActionStatus
    start_year: int


class CitySeed(TypedDict):
    name: str
    baseline_emissions: float
    target_year: int
    actions: list[ActionSeed]


CITIES: list[CitySeed] = [
    {
        "name": "Greenville",
        "baseline_emissions": 500_000,
        "target_year": 2035,
        "actions": [
            {"title": "Expand bike lane network",            "sector": Sector.transport,  "annual_reduction": 12_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Solar panel incentive program",       "sector": Sector.energy,     "annual_reduction": 45_000, "status": ActionStatus.in_progress, "start_year": 2023},
            {"title": "Municipal building retrofits",        "sector": Sector.buildings,  "annual_reduction": 18_000, "status": ActionStatus.planned,     "start_year": 2026},
            {"title": "Organic waste composting program",    "sector": Sector.waste,      "annual_reduction":  8_000, "status": ActionStatus.completed,   "start_year": 2022},
            {"title": "Urban reforestation initiative",      "sector": Sector.land_use,   "annual_reduction": 15_000, "status": ActionStatus.planned,     "start_year": 2025},
            {"title": "EV fleet transition for public transit", "sector": Sector.transport, "annual_reduction": 30_000, "status": ActionStatus.planned, "start_year": 2026},
        ],
    },
    {
        "name": "São Paulo",
        "baseline_emissions": 18_500_000,
        "target_year": 2050,
        "actions": [
            {"title": "Metro line 6 expansion",              "sector": Sector.transport, "annual_reduction": 450_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Rooftop solar mandate for new builds","sector": Sector.energy,    "annual_reduction": 320_000, "status": ActionStatus.in_progress, "start_year": 2025},
            {"title": "Cantareira watershed reforestation",  "sector": Sector.land_use,  "annual_reduction": 210_000, "status": ActionStatus.planned,     "start_year": 2026},
            {"title": "Methane capture at Bandeirantes landfill", "sector": Sector.waste, "annual_reduction": 180_000, "status": ActionStatus.completed, "start_year": 2021},
            {"title": "Energy retrofit for municipal schools","sector": Sector.buildings, "annual_reduction":  90_000, "status": ActionStatus.planned,     "start_year": 2027},
        ],
    },
    {
        "name": "Nova York",
        "baseline_emissions": 50_000_000,
        "target_year": 2050,
        "actions": [
            {"title": "Local Law 97 building emissions caps","sector": Sector.buildings, "annual_reduction": 1_200_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Congestion pricing south of 60th St", "sector": Sector.transport, "annual_reduction":   400_000, "status": ActionStatus.in_progress, "start_year": 2025},
            {"title": "Offshore wind procurement",           "sector": Sector.energy,    "annual_reduction": 1_500_000, "status": ActionStatus.planned,     "start_year": 2027},
            {"title": "Organics curbside pickup citywide",   "sector": Sector.waste,     "annual_reduction":   220_000, "status": ActionStatus.in_progress, "start_year": 2024},
        ],
    },
    {
        "name": "Londres",
        "baseline_emissions": 27_000_000,
        "target_year": 2030,
        "actions": [
            {"title": "Ultra Low Emission Zone expansion",   "sector": Sector.transport, "annual_reduction": 380_000, "status": ActionStatus.completed,   "start_year": 2023},
            {"title": "Heat pump retrofit grants",           "sector": Sector.buildings, "annual_reduction": 540_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Thames Tideway renewables",           "sector": Sector.energy,    "annual_reduction": 260_000, "status": ActionStatus.planned,     "start_year": 2026},
            {"title": "Rewilding programme — Greater London","sector": Sector.land_use,  "annual_reduction":  80_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Borough-level food waste collection", "sector": Sector.waste,     "annual_reduction":  95_000, "status": ActionStatus.planned,     "start_year": 2025},
        ],
    },
    {
        "name": "Tóquio",
        "baseline_emissions": 60_000_000,
        "target_year": 2050,
        "actions": [
            {"title": "Cap-and-trade for large buildings",   "sector": Sector.buildings, "annual_reduction": 900_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Hydrogen-fueled bus fleet",           "sector": Sector.transport, "annual_reduction": 250_000, "status": ActionStatus.planned,     "start_year": 2027},
            {"title": "Rooftop solar on metropolitan facilities", "sector": Sector.energy, "annual_reduction": 410_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Urban heat island greening",          "sector": Sector.land_use,  "annual_reduction": 130_000, "status": ActionStatus.planned,     "start_year": 2026},
        ],
    },
    {
        "name": "Berlim",
        "baseline_emissions": 15_000_000,
        "target_year": 2045,
        "actions": [
            {"title": "District heating decarbonisation",    "sector": Sector.energy,    "annual_reduction": 360_000, "status": ActionStatus.in_progress, "start_year": 2025},
            {"title": "U-Bahn modernization program",        "sector": Sector.transport, "annual_reduction": 140_000, "status": ActionStatus.planned,     "start_year": 2027},
            {"title": "Mandatory facade insulation",         "sector": Sector.buildings, "annual_reduction": 280_000, "status": ActionStatus.in_progress, "start_year": 2024},
            {"title": "Tempelhofer Feld biodiversity",       "sector": Sector.land_use,  "annual_reduction":  40_000, "status": ActionStatus.completed,   "start_year": 2022},
            {"title": "Biogas from organic waste",           "sector": Sector.waste,     "annual_reduction":  75_000, "status": ActionStatus.in_progress, "start_year": 2024},
        ],
    },
]


def seed(session: Session, *, reset: bool = False) -> list[City]:
    """Idempotently load CITIES. With reset=True, wipe everything first."""
    if reset:
        session.exec(delete(Action))  # type: ignore[arg-type]
        session.exec(delete(City))  # type: ignore[arg-type]
        session.commit()

    inserted: list[City] = []
    for entry in CITIES:
        existing = session.exec(
            select(City).where(City.name == entry["name"])
        ).first()
        if existing is not None:
            inserted.append(existing)
            continue
        city = City(
            name=entry["name"],
            baseline_emissions=entry["baseline_emissions"],
            target_year=entry["target_year"],
        )
        session.add(city)
        session.commit()
        session.refresh(city)
        for a in entry["actions"]:
            session.add(Action(city_id=city.id, **a))
        session.commit()
        session.refresh(city)
        inserted.append(city)
    return inserted


# Backwards-compat shim for the FastAPI lifespan. Returns the first city.
def seed_if_empty(session: Session) -> City:
    return seed(session, reset=False)[0]
```

- [ ] **Step 2: Wire seed_cli to the new function**

Edit `apps/api/app/seed_cli.py`:

- Replace `from .seed import seed_if_empty` with `from .seed import seed`.
- In `main`, replace the seeding call:

```python
        cities = seed(session, reset=args.reset)
        for city in cities:
            action_count = len(
                session.exec(select(Action).where(Action.city_id == city.id)).all()
            )
            logger.info(
                "Seeded %s · id=%s · baseline=%s t/yr · target=%s · actions=%d",
                city.name, city.id, city.baseline_emissions, city.target_year, action_count,
            )
```

Drop the `_reset(session)` helper (the new `seed(..., reset=True)` handles it) and remove its earlier call.

- [ ] **Step 3: Update lifespan in main.py**

In `apps/api/app/main.py` replace `from .seed import seed_if_empty` with `from .seed import seed`, and change the lifespan body:

```python
@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    with Session(get_engine()) as s:
        seed(s)
    yield
```

- [ ] **Step 4: Update conftest seeded_city fixture**

Edit `apps/api/tests/conftest.py`. The current `seeded_city` does `session.exec(select(City)).one()` which now matches 6 rows. Replace with:

```python
@pytest.fixture
def seeded_city(client, engine) -> City:
    """Greenville is seeded by the FastAPI lifespan; resolve its UUID for tests."""
    with Session(engine) as s:
        city = s.exec(select(City).where(City.name == "Greenville")).one()
        s.expunge(city)
        return city
```

- [ ] **Step 5: Update test_seed_cli.py**

Read the existing test first:

```bash
cd apps/api
uv run pytest tests/test_seed_cli.py -v
```

Rewrite the tests to cover:

```python
def test_seed_loads_six_cities(client, session):
    from sqlmodel import select
    from app.cities.models import City
    names = [c.name for c in session.exec(select(City).order_by(City.name)).all()]
    assert set(names) == {"Berlim", "Greenville", "Londres", "Nova York", "São Paulo", "Tóquio"}


def test_seed_is_idempotent(client, session):
    from app.seed import seed
    from sqlmodel import select
    from app.cities.models import City
    before = len(session.exec(select(City)).all())
    seed(session, reset=False)
    after = len(session.exec(select(City)).all())
    assert before == after == 6


def test_seed_cli_reset_flag(client, session):
    from sqlmodel import select
    from app.cities.models import City
    from app.actions.models import Action
    from app.seed_cli import main

    # Add a junk city; --reset should wipe it.
    session.add(City(name="JunkTown", baseline_emissions=1.0, target_year=2050))
    session.commit()
    assert main(["--reset"]) == 0
    names = {c.name for c in session.exec(select(City)).all()}
    assert "JunkTown" not in names
    assert len(names) == 6
    # Sanity: actions reseeded.
    assert len(session.exec(select(Action)).all()) > 0
```

Delete or rewrite any pre-existing assertions that relied on a single Greenville record.

- [ ] **Step 6: Run all seed-related tests**

```bash
cd apps/api
uv run pytest tests/test_seed_cli.py -v
```

Expected: All pass.

- [ ] **Step 7: Full suite sanity check**

```bash
cd apps/api
uv run pytest -v
```

Expected: All green. If `test_cities`, `test_actions`, `test_summary` rely on "first city is Greenville", they should already use `seeded_city` which now filters by name — but skim outputs for stragglers and fix any city-count assertions.

- [ ] **Step 8: Commit**

```bash
git add apps/api/app/seed.py apps/api/app/seed_cli.py apps/api/app/main.py apps/api/tests/conftest.py apps/api/tests/test_seed_cli.py
git commit -m "$(cat <<'EOF'
feat(api): seed six cities with idempotency and --reset flag

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Migration round-trip CI test

**Files:**
- Create: `apps/api/tests/test_migrations.py`

- [ ] **Step 1: Write the round-trip test**

```python
"""Verifies migrations are reversible: upgrade head, downgrade base, upgrade head."""

from pathlib import Path

import pytest

pytestmark = pytest.mark.skipif(
    "POSTGRES_TEST_URL" not in __import__("os").environ,
    reason="Requires POSTGRES_TEST_URL pointing at a disposable Postgres",
)


def test_migrations_round_trip(monkeypatch):
    import os
    from alembic import command
    from alembic.config import Config

    ini = Path(__file__).resolve().parents[1] / "alembic.ini"
    cfg = Config(str(ini))
    cfg.set_main_option("script_location", str(ini.parent / "migrations"))
    cfg.set_main_option("sqlalchemy.url", os.environ["POSTGRES_TEST_URL"])

    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")
```

- [ ] **Step 2: Run it locally (optional)**

```bash
cd apps/api
POSTGRES_TEST_URL=postgresql+psycopg://climate:climate@localhost:5432/climate_tracker \
  uv run pytest tests/test_migrations.py -v
```

Expected: PASS (or SKIP if the env var is absent).

- [ ] **Step 3: Commit**

```bash
git add apps/api/tests/test_migrations.py
git commit -m "$(cat <<'EOF'
test(api): migrations up/down/up round-trip guard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Docker entrypoint runs migrations

**Files:**
- Modify: `apps/api/Dockerfile`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Read the current Dockerfile**

```bash
cat apps/api/Dockerfile
```

- [ ] **Step 2: Update Dockerfile CMD or add entrypoint**

Replace the `CMD` (or add `ENTRYPOINT`) so it runs migrations before uvicorn:

```dockerfile
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

If the existing Dockerfile uses uv as the runner, use:

```dockerfile
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

- [ ] **Step 3: Also override compose command for dev (keeps --reload)**

In `docker-compose.yml`, change the `api.command`:

```yaml
    command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
```

(Use `uv run` prefixes if that matches the rest of the stack.)

- [ ] **Step 4: Rebuild and verify**

```bash
docker compose down -v
docker compose up -d --build
docker compose logs api | head -40
```

Expected: Logs show `Running upgrade  -> 0001_initial` and `0001_initial -> 0002_city_soft_delete`, then uvicorn starts. The 6 cities are seeded by the lifespan.

- [ ] **Step 5: Commit**

```bash
git add apps/api/Dockerfile docker-compose.yml
git commit -m "$(cat <<'EOF'
chore(deploy): run alembic upgrade before uvicorn on startup

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Frontend — schemas, cache keys, hooks

**Files:**
- Modify: `apps/web/lib/schemas/city.ts`
- Modify: `apps/web/lib/cache.ts`
- Modify: `apps/web/features/cities/hooks.ts`

- [ ] **Step 1: Extend the city Zod schema**

Replace `apps/web/lib/schemas/city.ts` with:

```typescript
import { z } from "zod";

export const CitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  baseline_emissions: z.number().nonnegative(),
  target_year: z.number().int().min(1900).max(2100),
  deleted_at: z.string().datetime().nullable().optional(),
});

export const CityCreateSchema = z.object({
  name: z.string().min(1),
  baseline_emissions: z.number().nonnegative(),
  target_year: z.number().int().min(1900).max(2100),
});

export const CityUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  baseline_emissions: z.number().nonnegative().optional(),
  target_year: z.number().int().min(1900).max(2100).optional(),
});

export type City = z.infer<typeof CitySchema>;
export type CityCreate = z.infer<typeof CityCreateSchema>;
export type CityUpdate = z.infer<typeof CityUpdateSchema>;
```

- [ ] **Step 2: Add adminCities key**

Edit `apps/web/lib/cache.ts`, replace `KEYS`:

```typescript
export const KEYS = {
  cities: "/cities" as const,
  adminCities: "/cities?include_deleted=true" as const,
  city: (id: string) => `/cities/${id}` as const,
  actions: (cityId: string) => `/cities/${cityId}/actions` as const,
  summary: (cityId: string, asOf?: number) =>
    asOf == null
      ? (`/cities/${cityId}/summary` as const)
      : (`/cities/${cityId}/summary?as_of=${asOf}` as const),
};
```

And extend `revalidateCity` to also mutate `KEYS.adminCities`:

```typescript
export async function revalidateCity(cityId: string) {
  await Promise.all([
    mutate(KEYS.cities),
    mutate(KEYS.adminCities),
    mutate(KEYS.city(cityId)),
    mutate(KEYS.actions(cityId)),
    mutate(KEYS.summary(cityId)),
  ]);
}
```

- [ ] **Step 3: Rewrite hooks.ts**

Replace `apps/web/features/cities/hooks.ts` with:

```typescript
import useSWR from "swr";

import { api, fetcher } from "@/lib/api";
import { KEYS, revalidateCity } from "@/lib/cache";
import type { City, CityCreate } from "@/lib/schemas";

export function useCities() {
  return useSWR<City[]>(KEYS.cities, fetcher);
}

export function useAdminCities() {
  return useSWR<City[]>(KEYS.adminCities, fetcher);
}

export async function createCity(payload: CityCreate): Promise<City> {
  const city = await api.post<City>("/cities", payload);
  await revalidateCity(city.id);
  return city;
}

export async function archiveCity(id: string): Promise<City> {
  const city = await api.delete<City>(`/cities/${id}`);
  await revalidateCity(id);
  return city;
}

export async function restoreCity(id: string): Promise<City> {
  const city = await api.post<City>(`/cities/${id}/restore`, {});
  await revalidateCity(id);
  return city;
}
```

**Important:** `useDefaultCity` is deleted in this step. The next tasks rewire all callers.

Verify the `api` client exposes `delete` and `post`. Read `apps/web/lib/api.ts` first; if `delete` isn't there, add it following the same pattern as `patch`/`post`.

- [ ] **Step 4: TypeScript check**

```bash
cd apps/web
npm run typecheck
```

Expected: Errors in `PublicDashboard.tsx`, `CitySettings.tsx`, `ActionsManager.tsx` complaining about `useDefaultCity` missing. That's intended — the next tasks fix those callers.

- [ ] **Step 5: Commit (WIP, will compile after Tasks 12-14)**

```bash
git add apps/web/lib/schemas/city.ts apps/web/lib/cache.ts apps/web/features/cities/hooks.ts apps/web/lib/api.ts
git commit -m "$(cat <<'EOF'
feat(web): city schemas, hooks, and cache keys for multi-city + soft delete

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: CitySelector component

**Files:**
- Create: `apps/web/features/cities/components/CitySelector.tsx`

- [ ] **Step 1: Build a controlled selector**

```typescript
"use client";

import type { City } from "@/lib/schemas";

type Props = {
  cities: City[];
  value: string | null;
  onChange: (cityId: string) => void;
  className?: string;
  /** Renders an "Archived" badge next to soft-deleted cities. */
  showArchivedBadge?: boolean;
};

export function CitySelector({
  cities,
  value,
  onChange,
  className,
  showArchivedBadge = false,
}: Props) {
  return (
    <label className={`flex items-center gap-3 ${className ?? ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-mute">
        City
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink-line/60 bg-bg px-3 py-2 text-sm text-ink shadow-soft focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {showArchivedBadge && c.deleted_at ? " (Archived)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/features/cities/components/CitySelector.tsx
git commit -m "$(cat <<'EOF'
feat(web): CitySelector component

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: PublicDashboard consumes selected city

**Files:**
- Modify: `apps/web/features/dashboard/components/PublicDashboard.tsx`
- Modify: `apps/web/app/(public)/page.tsx` (only if it should host the selector)

- [ ] **Step 1: Rewrite PublicDashboard**

The dashboard becomes a host that owns selection state and renders the selector above the existing content. Replace the top portion of `apps/web/features/dashboard/components/PublicDashboard.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { ErrorMessage } from "@/components/ui";
import { useActions } from "@/features/actions/hooks";
import { CitySelector } from "@/features/cities/components/CitySelector";
import { useCities } from "@/features/cities/hooks";
import { ActionSchema, Summary, SummarySchema } from "@/lib/schemas";

import { useSummary } from "../hooks";
import { Methodology } from "./Methodology";
import { OnTrackCard } from "./OnTrackCard";
import { ProgressCard } from "./ProgressCard";
import { ProjectionChart } from "./ProjectionChart";
import { SectorBreakdown } from "./SectorBreakdown";

export function PublicDashboard() {
  const { data: cities, isLoading: citiesLoading, error: citiesError } = useCities();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && cities && cities.length > 0) {
      setSelectedId(cities[0].id);
    }
  }, [cities, selectedId]);

  const selected = cities?.find((c) => c.id === selectedId) ?? null;

  const { data: raw, isLoading, error } = useSummary(selected?.id);
  const { data: actionsRaw } = useActions(selected?.id);

  if (citiesLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-ink-mute">
        <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
        <span>Loading cities…</span>
      </div>
    );
  }

  if (citiesError || !cities) {
    return <ErrorMessage>Could not load city configuration.</ErrorMessage>;
  }

  if (cities.length === 0) {
    return (
      <ErrorMessage>
        No cities are configured yet. Ask an admin to seed the database.
      </ErrorMessage>
    );
  }

  return (
    <div className="space-y-6">
      <CitySelector cities={cities} value={selectedId} onChange={setSelectedId} />

      {isLoading || !selected ? (
        <div className="text-sm text-ink-mute">Loading dashboard…</div>
      ) : error || !raw ? (
        <ErrorMessage>Could not load progress data.</ErrorMessage>
      ) : (
        <DashboardBody raw={raw} actionsRaw={actionsRaw} />
      )}
    </div>
  );
}

function DashboardBody({ raw, actionsRaw }: { raw: unknown; actionsRaw: unknown }) {
  const parsed = SummarySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <ErrorMessage>
        The API returned an unexpected payload shape. Try refreshing.
      </ErrorMessage>
    );
  }
  const actions = z.array(ActionSchema).safeParse(actionsRaw ?? []);
  return (
    <DashboardView
      summary={parsed.data}
      actions={actions.success ? actions.data : []}
    />
  );
}

// DashboardView and Stat stay exactly as they are today below this line.
```

Keep the existing `DashboardView` and `Stat` functions in the file (lines 58-176 in the current version) — only the top half is rewritten.

- [ ] **Step 2: Typecheck**

```bash
cd apps/web
npm run typecheck
```

Expected: PublicDashboard-related errors cleared. Errors remain in admin files (fixed next task).

- [ ] **Step 3: Smoke test in browser**

```bash
cd apps/web
npm run dev
```

Open `http://localhost:3000`. Expected: selector at top with 6 cities; switching city updates the hero, charts, sector breakdown.

- [ ] **Step 4: Commit**

```bash
git add apps/web/features/dashboard/components/PublicDashboard.tsx
git commit -m "$(cat <<'EOF'
feat(web): public dashboard with city selector

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: AdminWorkspace — selector, New City modal, Archive, View archived

**Files:**
- Create: `apps/web/features/cities/components/NewCityModal.tsx`
- Create: `apps/web/features/cities/components/ArchiveCityButton.tsx`
- Modify: `apps/web/features/cities/components/CitySettings.tsx`
- Modify: `apps/web/features/actions/components/ActionsManager.tsx`
- Modify: `apps/web/app/(admin)/admin/_components/AdminWorkspace.tsx`

- [ ] **Step 1: Read existing modal primitive used by ActionsManager**

```bash
grep -n "Dialog\|Modal" apps/web/components/ui/index.ts apps/web/features/actions/components/*.tsx | head
```

Match its API in the new modal so the admin UI feels consistent. If there's a shared `Dialog` component, import it; otherwise replicate the pattern used by the action edit/create modals.

- [ ] **Step 2: NewCityModal**

Create `apps/web/features/cities/components/NewCityModal.tsx`. Skeleton (adapt to the shared dialog primitive):

```typescript
"use client";

import { FormEvent, useState } from "react";

import { Button, ErrorMessage, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { CityCreateSchema, type City } from "@/lib/schemas";

import { createCity } from "../hooks";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (city: City) => void;
};

export function NewCityModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [baseline, setBaseline] = useState("");
  const [target, setTarget] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    const payload = {
      name: name.trim(),
      baseline_emissions: Number(baseline),
      target_year: Number(target),
    };
    const parsed = CityCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const f = issue.path[0]?.toString() ?? "form";
        next[f] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    try {
      setSaving(true);
      const created = await createCity(parsed.data);
      onCreated(created);
      setName(""); setBaseline(""); setTarget("");
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create city.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-bg p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold tracking-tight text-ink">New city</h2>
        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
          <Field id="new-city-name" label="City name"
                 value={name} onChange={setName} error={fieldErrors.name} required />
          <Field id="new-city-baseline" label="Baseline emissions (t CO₂ / yr)"
                 type="number" min={0} step="any"
                 value={baseline} onChange={setBaseline}
                 error={fieldErrors.baseline_emissions} required />
          <Field id="new-city-target" label="Target year (net zero)"
                 type="number" min={1900} max={2100}
                 value={target} onChange={setTarget}
                 error={fieldErrors.target_year} required />
          {formError && <ErrorMessage>{formError}</ErrorMessage>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create city"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

If the project already has a `Dialog` primitive, replace the outer wrapper with it.

- [ ] **Step 3: ArchiveCityButton (+ Restore inline)**

Create `apps/web/features/cities/components/ArchiveCityButton.tsx`:

```typescript
"use client";

import { useState } from "react";

import { Button, ErrorMessage } from "@/components/ui";
import { ApiError } from "@/lib/api";
import type { City } from "@/lib/schemas";

import { archiveCity, restoreCity } from "../hooks";

type Props = {
  city: City;
  onChanged: (city: City) => void;
};

export function ArchiveCityButton({ city, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isArchived = !!city.deleted_at;

  async function handle() {
    if (!isArchived) {
      const ok = window.confirm(
        `Archive ${city.name}? It will be hidden from the public dashboard.`,
      );
      if (!ok) return;
    }
    try {
      setBusy(true);
      const updated = isArchived ? await restoreCity(city.id) : await archiveCity(city.id);
      onChanged(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Operation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="ghost" size="sm" onClick={handle} disabled={busy}>
        {isArchived ? "Restore city" : "Archive city"}
      </Button>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
```

- [ ] **Step 4: CitySettings accepts `city` prop and shows archived banner**

Replace the top of `apps/web/features/cities/components/CitySettings.tsx`:

```typescript
"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button, ErrorMessage, Field, SuccessMessage } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { revalidateCity } from "@/lib/cache";
import { City, CityUpdateSchema } from "@/lib/schemas";

type Props = { city: City };

export function CitySettings({ city }: Props) {
  if (city.deleted_at) {
    return (
      <section className="rounded-2xl border border-amber-300 bg-amber-50 px-7 py-5 text-sm text-amber-900">
        This city is archived. Restore it to make changes.
      </section>
    );
  }
  return <CitySettingsForm city={city} />;
}

// CitySettingsForm stays as today (lines 31-183), unchanged.
```

Delete the old `import { useDefaultCity }` line and the wrapper that fetched the city — the parent now passes it in.

- [ ] **Step 5: ActionsManager accepts a `city` prop and shows archived banner**

Read `apps/web/features/actions/components/ActionsManager.tsx`. Change the component signature to `function ActionsManager({ initialDraft, onDraftConsumed, city }: ...)`, drop any internal `useDefaultCity` call, and at the top of the render: if `city.deleted_at`, return the same banner used in CitySettings ("This city is archived. Restore it to make changes."), disabling all mutation controls. Mutation handlers should be no-ops if `city.deleted_at` is set (defense in depth — API also rejects with 409).

If `ActionImport` also pulls a city internally, give it a `cityId` prop too.

- [ ] **Step 6: AdminWorkspace integration**

Replace `apps/web/app/(admin)/admin/_components/AdminWorkspace.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button, ErrorMessage } from "@/components/ui";
import { ActionImport } from "@/features/actions/components/ActionImport";
import { ActionsManager } from "@/features/actions/components/ActionsManager";
import { ArchiveCityButton } from "@/features/cities/components/ArchiveCityButton";
import { CitySelector } from "@/features/cities/components/CitySelector";
import { CitySettings } from "@/features/cities/components/CitySettings";
import { NewCityModal } from "@/features/cities/components/NewCityModal";
import { useAdminCities, useCities } from "@/features/cities/hooks";
import { clearAdminToken } from "@/lib/auth";
import { ActionDraft, City } from "@/lib/schemas";

export function AdminWorkspace() {
  const router = useRouter();
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  const activeQuery = useCities();
  const allQuery = useAdminCities();
  const source = showArchived ? allQuery : activeQuery;
  const cities = source.data ?? [];

  useEffect(() => {
    if (!selectedId && cities.length > 0) setSelectedId(cities[0].id);
  }, [cities, selectedId]);

  const selected: City | null = useMemo(
    () => cities.find((c) => c.id === selectedId) ?? null,
    [cities, selectedId],
  );

  function handleLogout() {
    clearAdminToken();
    router.replace("/admin/login");
    router.refresh();
  }

  if (source.isLoading) return <p className="text-sm text-ink-mute">Loading admin…</p>;
  if (source.error || cities.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button>
        </div>
        <ErrorMessage>No cities available. Create one to begin.</ErrorMessage>
        <Button onClick={() => setShowNewModal(true)}>New city</Button>
        <NewCityModal
          open={showNewModal}
          onClose={() => setShowNewModal(false)}
          onCreated={(c) => {
            setSelectedId(c.id);
            allQuery.mutate();
            activeQuery.mutate();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <CitySelector
          cities={cities}
          value={selectedId}
          onChange={setSelectedId}
          showArchivedBadge={showArchived}
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm"
                  onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : "View archived"}
          </Button>
          <Button size="sm" onClick={() => setShowNewModal(true)}>New city</Button>
          {selected && (
            <ArchiveCityButton
              city={selected}
              onChanged={(c) => {
                allQuery.mutate();
                activeQuery.mutate();
                if (c.deleted_at && !showArchived) {
                  const next = cities.find((x) => x.id !== c.id && !x.deleted_at);
                  setSelectedId(next?.id ?? null);
                }
              }}
            />
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>Sign out</Button>
        </div>
      </div>

      {selected && <CitySettings city={selected} />}
      {selected && !selected.deleted_at && (
        <>
          <ActionImport onUseDraft={setDraft} cityId={selected.id} />
          <ActionsManager
            city={selected}
            initialDraft={draft}
            onDraftConsumed={() => setDraft(null)}
          />
        </>
      )}

      <NewCityModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(c) => {
          setSelectedId(c.id);
          allQuery.mutate();
          activeQuery.mutate();
        }}
      />
    </div>
  );
}
```

If `ActionImport` doesn't accept `cityId` yet, give it the prop (it presumably already needs a city — just pass `selected.id` explicitly).

- [ ] **Step 7: Typecheck and run dev**

```bash
cd apps/web
npm run typecheck
npm run dev
```

Expected: zero TS errors; admin page loads at `/admin`, you can switch cities, create a new one (modal), archive (confirm dialog), toggle "View archived", restore.

- [ ] **Step 8: Manual smoke test (golden path)**

1. Open `/admin/login`, sign in.
2. Verify the selector lists the 6 seeded cities.
3. Click **New city**: create "Test City". Confirm the selector auto-selects it.
4. Edit baseline, save → success message.
5. Click **Archive city** → confirm → city disappears from selector; next active city is selected.
6. Toggle **View archived** → "Test City" appears with `(Archived)`; select it → banner reads "This city is archived…"; click **Restore city** → banner clears, fields editable again.
7. Open `/` in another tab: archived "Test City" must NOT appear; restored city must reappear.

- [ ] **Step 9: Commit**

```bash
git add apps/web/features/cities/components/NewCityModal.tsx \
        apps/web/features/cities/components/ArchiveCityButton.tsx \
        apps/web/features/cities/components/CitySettings.tsx \
        apps/web/features/actions/components/ActionsManager.tsx \
        apps/web/app/\(admin\)/admin/_components/AdminWorkspace.tsx
git commit -m "$(cat <<'EOF'
feat(web): admin multi-city workspace (select, create, archive, restore)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: README + .env.example housekeeping

**Files:**
- Modify: `README.md`
- Modify: `apps/api/.env.example` (or wherever the project keeps it)

- [ ] **Step 1: Document the migration model**

Add a short "Database migrations" section to `README.md`:

```markdown
## Database migrations

Schema is managed by Alembic (`apps/api/migrations/`). On `docker compose up`, the
api container runs `alembic upgrade head` before uvicorn. Seed data (6 sample
cities) loads automatically via the FastAPI lifespan on first boot.

**Local commands** (from `apps/api/`):

    uv run alembic upgrade head     # apply pending migrations
    uv run alembic downgrade -1     # roll back one
    uv run alembic revision -m "..."  # create a new migration

**Resetting the database for demos:**

    docker compose down -v
    docker compose up -d

Or, keep the volume but reseed:

    docker compose exec api uv run python -m app.seed_cli --reset

**Existing developer databases** (pre-Alembic): drop the volume, OR run
`uv run alembic stamp 0001_initial && uv run alembic upgrade head` to adopt the
migration chain without losing data.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs: document alembic and multi-city seed workflow

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Final verification

- [ ] **Step 1: Run the full backend test suite**

```bash
cd apps/api
uv run pytest -v
```

Expected: 100% green (no skipped tests except the migration round-trip without `POSTGRES_TEST_URL`).

- [ ] **Step 2: Run the web typecheck and any frontend tests**

```bash
cd apps/web
npm run typecheck
npm run test --if-present
```

- [ ] **Step 3: End-to-end smoke**

```bash
docker compose down -v
docker compose up -d --build
```

Wait ~10s, then:

- `curl http://localhost:8000/cities | jq '.[].name'` → 6 cities listed.
- Open `http://localhost:3000` → selector with all 6 cities, switching updates dashboard.
- Open `http://localhost:3000/admin/login` → sign in, complete the manual smoke test from Task 14 Step 8.

- [ ] **Step 4: Final commit (only if any fix was needed)**

If iterations were needed, commit them now with appropriately scoped messages.

---

## Out of Scope (deliberately not in this plan)

These items came up during spec but were explicitly excluded — leave them for a follow-up plan:

- Slug-based URLs (`/cities/<slug>`).
- Cross-city comparison views.
- Audit trail (`deleted_by`, timestamps log).
- i18n of UI strings.
- Hard delete.
