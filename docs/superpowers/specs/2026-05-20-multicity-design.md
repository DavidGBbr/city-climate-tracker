# Multi-city Support — Design Spec

**Date:** 2026-05-20
**Status:** Draft — awaiting user approval
**Scope:** API + Web + Seed + Migrations

## 1. Goal

The application currently treats data as effectively single-city: `useDefaultCity()` always returns the first city, the seed inserts only Greenville, and there is no UI affordance to switch cities. This spec turns the app into a real multi-city product:

- Public dashboard lets visitors switch between cities.
- Admin workspace lets admins create, edit, and soft-delete cities and operate on whichever one is selected.
- Seed loads **6 cities** (Greenville + São Paulo + Nova York + Londres + Tóquio + Berlim) with varied actions.
- Alembic is introduced so the `deleted_at` column (and future schema changes) ship as proper migrations.

All UI copy remains in **English** (only the city names are localized as needed).

## 2. Non-goals

- Authentication / authorization changes (admin role stays as today).
- City comparison views (cross-city dashboards, leaderboards).
- Per-city theming.
- i18n of the UI itself.
- Hard delete or cascade-delete of cities.
- Slugs / SEO-friendly URLs (URL remains `/` for the public dashboard).

## 3. Data model changes

### 3.1 `City` gets `deleted_at`

```python
class City(CityBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    deleted_at: datetime | None = Field(default=None, index=True)
    actions: list["Action"] = Relationship(
        back_populates="city",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
```

- Soft delete = `deleted_at = utcnow()`; restore = `deleted_at = None`.
- Indexed because every public query filters by it.
- Actions are **not** soft-deleted; they remain attached to the city and reappear on restore.

### 3.2 Query helper

A single helper to keep "active city" semantics consistent:

```python
def active_cities_stmt(include_deleted: bool = False):
    stmt = select(City)
    if not include_deleted:
        stmt = stmt.where(City.deleted_at.is_(None))
    return stmt
```

Used by every list/get/summary path. `get_or_404` for City gets an `include_deleted` flag (default `False`) so public lookups 404 on archived cities while admin can opt in.

## 4. API changes

### 4.1 New / changed endpoints

| Method | Route | Auth | Behavior |
|---|---|---|---|
| `GET` | `/cities?include_deleted=false` | public | List active cities. `include_deleted=true` requires admin (otherwise 403). |
| `GET` | `/cities/{id}` | public | 404 if soft-deleted (admin can pass `?include_deleted=true`). |
| `POST` | `/cities` | admin | Create. Body: `name`, `baseline_emissions`, `target_year`. 409 on duplicate `name` (case-insensitive). |
| `PATCH` | `/cities/{id}` | admin | Unchanged. Operates on active or archived (admin can rename a restored city). |
| `DELETE` | `/cities/{id}` | admin | Soft delete. Idempotent: deleting an already-archived city returns 200 with current state. |
| `POST` | `/cities/{id}/restore` | admin | Clears `deleted_at`. 404 if city doesn't exist. |
| `GET` | `/cities/{id}/summary` | public | 404 if archived. |
| Actions endpoints | unchanged routes | mixed | All action queries filter to `city.deleted_at IS NULL`. Admin endpoints reject mutations on archived cities (409 with a clear message). |

### 4.2 Schemas

- `CityCreate` (new): `name`, `baseline_emissions`, `target_year`. Validations mirror `CityBase`.
- `CityRead`: gains optional `deleted_at` (admin-only field — exposed but `None` for active cities, so harmless to clients).
- `CityUpdate`: unchanged.

### 4.3 Cross-cutting

- Unique constraint on `City.name` (case-insensitive via `func.lower`), to make 409 on create deterministic.
- All admin routes already guarded by `require_admin`; new routes follow the same pattern.

## 5. Migrations (Alembic)

Alembic is introduced from scratch as part of this work.

### 5.1 Setup

- Add `alembic` to `pyproject.toml` (uv-managed).
- `alembic init migrations` inside `apps/api/`, then customize:
  - `env.py` reads `SQLModel.metadata` and `database_url` from `app.core.config.get_settings`.
  - Offline mode supported for CI inspection.
- Update `core/db.py.init_db()` to **stop** doing `create_all` when running under a "real" environment. Strategy:
  - Default: `init_db()` runs `alembic upgrade head` programmatically.
  - Tests keep `create_all` against an in-memory SQLite (faster, no migration noise). Detection: `database_url` startswith `sqlite:///:memory:` OR a `settings.use_metadata_create_all` flag.
- Docker Compose `api` service runs `alembic upgrade head` before `uvicorn`.

### 5.2 Migrations to author

1. **`0001_initial.py`** — baseline matching current schema (cities, actions, all existing columns). Generated via autogenerate against an empty DB, then reviewed.
2. **`0002_city_soft_delete.py`** — adds `deleted_at` column (nullable, indexed) + case-insensitive unique index on `name`.

Existing developer databases: documented in README — drop the volume and let migrations re-create, OR run `alembic stamp 0001_initial` then `alembic upgrade head` to adopt without losing data.

## 6. Seed

### 6.1 Cities (6 total)

```python
CITIES = [
    {
        "name": "Greenville",                # PDF exercise — preserved
        "baseline_emissions": 500_000,
        "target_year": 2035,
        "actions": [...],                    # current 6 actions
    },
    {"name": "São Paulo",   "baseline_emissions": 18_500_000, "target_year": 2050, "actions": [...]},
    {"name": "Nova York",   "baseline_emissions": 50_000_000, "target_year": 2050, "actions": [...]},
    {"name": "Londres",     "baseline_emissions": 27_000_000, "target_year": 2030, "actions": [...]},
    {"name": "Tóquio",      "baseline_emissions": 60_000_000, "target_year": 2050, "actions": [...]},
    {"name": "Berlim",      "baseline_emissions": 15_000_000, "target_year": 2045, "actions": [...]},
]
```

Each new city ships with **4–6 actions** spanning multiple sectors and statuses so dashboards look healthy out of the box. Baselines and reductions are demo-grade approximations, not policy figures (called out in a comment).

### 6.2 Idempotency

`seed_if_empty` is replaced by `seed(session, *, reset: bool = False)`:

- `reset=True` → `DELETE FROM actions; DELETE FROM cities` first, then insert everything.
- `reset=False` (default) → for each entry in `CITIES`, look up by `name`; insert only if missing. Existing actions are **not** touched (we don't reconcile action lists on re-seed).

### 6.3 CLI

`seed_cli.py` gets a `--reset` flag (default off). README + `.env.example` updated. Existing test `test_seed_cli.py` extended to cover both modes.

## 7. Frontend — public dashboard

### 7.1 City selector

- New component `features/cities/components/CitySelector.tsx`. Headless dropdown with city name + small baseline subtitle. Styled in line with existing UI tokens.
- Mounted at the top of `PublicDashboard`, above the hero.
- State: local `useState` in `PublicDashboard`, default = first active city (alphabetical). No URL param, no localStorage (per scope decision).
- `useDefaultCity` is **deleted**. Callers receive the selected city via prop or a small `useSelectedCity()` context, depending on tree shape (decided during implementation; default = prop drilling since the tree is shallow).

### 7.2 Loading & empty states

- "No cities yet" empty state for fresh installs (seed hasn't run).
- Selector shows a skeleton row while `useCities` is loading.

## 8. Frontend — admin workspace

### 8.1 City selector + management

- Same `<CitySelector />` at the top of `AdminWorkspace`, but with two extra controls:
  - **"New city"** button → opens a modal (same dialog primitive used by action modals) with `name`, `baseline_emissions`, `target_year`. On success: refetch cities, auto-select the new one.
  - **"Archive city"** button → confirm dialog ("Archive {name}? It will be hidden from the public dashboard."). Calls `DELETE /cities/{id}`. On success: select another active city.
- A **"View archived"** toggle (button, not a toast) next to the selector. When on, the selector dropdown also lists archived cities (badge `Archived`) and each archived item exposes a **Restore** action. No automatic undo.

### 8.2 Mutations on archived cities

`ActionsManager` and `CitySettings` detect when the selected city is archived and render a read-only banner ("This city is archived. Restore it to make changes."), disabling mutation controls.

### 8.3 Data hooks

- `useCities()` stays as-is for the public side.
- `useAdminCities()` (new): same hook but appends `?include_deleted=true`. Used inside admin only.

## 9. Testing

### 9.1 Backend

- `test_cities_router.py`:
  - Create (success, duplicate name 409, non-admin 401/403).
  - Delete soft-deletes and hides from public list / summary / get.
  - Restore brings back actions & summary.
  - `include_deleted=true` requires admin.
- `test_actions_router.py`: mutations on archived city return 409.
- `test_seed.py`: 6 cities loaded; re-running is idempotent; `reset=True` clears and re-inserts.
- `test_seed_cli.py`: `--reset` flag round-trip.
- Existing fixtures that assumed "1 city" are updated to either pick a specific city or stop relying on count.

### 9.2 Frontend

- Smoke test: changing the selector changes the data shown (mock fetcher).
- Admin: archive button hides the city from non-admin view; restore brings it back.

### 9.3 Migrations

- CI step: spin up Postgres, run `alembic upgrade head` from scratch, then `alembic downgrade base`, then `upgrade head` again. Catches reversible-migration bugs.

## 10. Rollout / dev impact

- Existing dev DBs need either a wipe or `alembic stamp 0001_initial && alembic upgrade head`. Documented in README.
- Docker Compose `api` entrypoint runs migrations before uvicorn — no manual step for fresh checkouts.

## 11. Open questions

None at spec-writing time. All four user-blocking questions (city count, list, migrations, undo UX) were resolved before this doc was written.

## 12. Out-of-spec items captured for backlog

- Per-city slug + canonical URLs (`/cities/<slug>`).
- Cross-city comparison page.
- Auditing who archived a city and when (would need a `deleted_by` and a small audit log).
