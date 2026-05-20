# City Climate Action Tracker

OEF AI-Native Software Engineer Exercise — a lightweight web app for city climate teams to manage actions and citizens to track progress.

> Status: **scaffolding in place (T1)** — full feature build in progress.

## Stack

- **Backend** — FastAPI · SQLModel · PostgreSQL · LangChain (structured extraction)
- **Frontend** — Next.js 14 (App Router) · SWR · Tailwind CSS
- **Infra** — Docker Compose · GitHub Actions

## Quick start

```bash
cp .env.example .env
# edit .env and set OPENAI_API_KEY for the LLM import feature
docker compose up --build
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Web      | http://localhost:3000        |
| API      | http://localhost:8000        |
| Postgres | localhost:5432               |

## Layout

```
oef/
├── apps/
│   ├── api/          # FastAPI + SQLModel + LangChain
│   └── web/          # Next.js + Tailwind + SWR
├── docker-compose.yml
├── .env.example
└── README.md
```

More docs (running tests, architecture decisions, AI workflow write-up) ship with later tasks.

## Database migrations

Schema is managed by Alembic (`apps/api/migrations/`). On `docker compose up`, the api container runs `alembic upgrade head` before uvicorn. Seed data (6 sample cities) loads automatically via the FastAPI lifespan on first boot.

**Local commands** (from `apps/api/`):

```bash
uv run alembic upgrade head        # apply pending migrations
uv run alembic downgrade -1        # roll back one
uv run alembic revision -m "..."   # create a new migration
```

**Resetting the database for demos:**

```bash
docker compose down -v
docker compose up -d
```

Or, keep the volume but reseed:

```bash
docker compose exec api python -m app.seed_cli --reset
```

**Existing developer databases** (pre-Alembic): drop the volume, OR run `uv run alembic stamp 0001_initial && uv run alembic upgrade head` to adopt the migration chain without losing data.

**Windows note:** if `localhost:5432` is occupied by a native Postgres service, host-side alembic against the dev DB will fail with auth errors. Run alembic from inside the api container (`docker compose exec api alembic upgrade head`) or stop the native service.
