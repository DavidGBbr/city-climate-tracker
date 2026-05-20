# City Climate Action Tracker

OEF AI-Native Software Engineer Exercise — a lightweight web app for city climate teams to manage actions and citizens to track progress toward net-zero targets.

> **Delivered in ~4 hours of focused work** (one session, Claude Code as primary driver). Scope below — including AI extraction, projection chart, soft-delete lifecycle, 80 tests, CI/CD to a VPS with TLS — was shipped within that window. See [AI-WORKFLOW.md](AI-WORKFLOW.md) for how.

## Live demo

| Surface | URL | Credentials |
| --- | --- | --- |
| Public dashboard | https://oef.gestaoia.cloud/ | — |
| Admin workspace | https://oef.gestaoia.cloud/admin | password: `hire_david_2026` |

The admin password is shared (single-admin model — see [docs/DECISIONS.md](docs/DECISIONS.md)).

## What it does

**Public viewer**
- Pick any city from the selector
- See baseline emissions, target year, and the action ledger
- Summary dashboard: total estimated reductions vs. baseline, breakdown by sector, an on-track/off-track signal
- **Projected emissions chart** — year-by-year trajectory from baseline to target year, with the linear pacing target overlaid; today's marker fixes the eye on the gap between commitment and reality
- "On track" pacing uses the **earliest action start year** as the journey clock, not an arbitrary program year — see `apps/api/app/services/summary.py`

**Admin workspace** (`/admin`)
- Create, archive, and restore cities (soft delete — archived cities stay queryable for auditing)
- Edit baseline emissions and target year
- Full CRUD on climate actions (title, sector, annual CO₂ reduction, status, start year)
- **AI import**: paste a paragraph of policy text, get a structured `ActionDraft` extracted by an LLM; review and edit before saving
- Sign out clears the admin cookie

## Stack

- **Backend** — FastAPI · SQLModel · Alembic · PostgreSQL 16 · LangChain (structured extraction via `with_structured_output`)
- **Frontend** — Next.js 14 (App Router) · React · SWR · Tailwind CSS · Zod
- **Auth** — single shared admin password → JWT in `SameSite=Lax` cookie, Next.js middleware gates `/admin/*`, FastAPI `require_admin` dep verifies signature
- **Infra** — Docker Compose · Alembic migrations on container start · GitHub Actions CI/CD to a VPS · Traefik reverse proxy with Let's Encrypt TLS

## Quick start (local)

```bash
cp .env.example .env
# minimum: set OPENAI_API_KEY for the AI import feature
docker compose up --build
```

| Service  | URL                          |
| -------- | ---------------------------- |
| Web      | http://localhost:3000        |
| API      | http://localhost:8000        |
| API docs | http://localhost:8000/docs   |
| Postgres | localhost:5432               |

On first boot the API container runs `alembic upgrade head` and seeds six sample cities (Greenville, Riverside, Lakeshore, Mesa Verde, Harbor City, Pine Hollow).

## Tests

```bash
# API (80 tests, all green)
docker compose exec api pytest

# Web — type-check, lint, build
docker compose exec web npm run lint
docker compose exec web npm run typecheck
docker compose exec web npm run build
```

CI runs the same on every push (`.github/workflows/`).

## Project layout

```
oef/
├── apps/
│   ├── api/                  # FastAPI + SQLModel + Alembic + LangChain
│   │   ├── app/
│   │   │   ├── routers/      # cities, actions, summary, auth, ai
│   │   │   ├── services/     # summary on-track calculation
│   │   │   ├── ai/           # extractor with idempotency cache + Protocol stub
│   │   │   └── migrations/   # alembic
│   │   └── tests/            # pytest, 80 tests, fully offline (no real LLM)
│   └── web/                  # Next.js 14 App Router
│       ├── app/(public)/     # citizen-facing routes
│       ├── app/(admin)/      # admin/login + admin workspace
│       ├── features/         # cities, actions — hooks + components
│       └── middleware.ts     # cookie-gated /admin guard
├── docs/
│   ├── DECISIONS.md          # architecture decisions
│   └── AI-WORKFLOW.md → ../AI-WORKFLOW.md
├── docker-compose.yml        # dev
├── docker-compose.prod.yml   # prod override (Traefik labels, prod Dockerfiles)
├── .github/workflows/        # CI + deploy
└── AI-WORKFLOW.md            # write-up of how AI was used
```

## Database migrations

Schema is managed by Alembic (`apps/api/migrations/`). The api container runs `alembic upgrade head` before uvicorn starts. Seed data loads via the FastAPI lifespan on first boot.

```bash
# from apps/api/, locally
uv run alembic upgrade head
uv run alembic downgrade -1
uv run alembic revision -m "..."
```

Reset the database for a clean demo:

```bash
docker compose down -v
docker compose up -d
```

Or keep the volume but reseed:

```bash
docker compose exec api python -m app.seed_cli --reset
```

**Windows note:** if a native Postgres service occupies 5432, run alembic from inside the container (`docker compose exec api alembic upgrade head`) or stop the native service.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml` — the workflow SSHes into the VPS, pulls the new image, runs `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`, and waits for the HTTPS health check at `https://oef.gestaoia.cloud/`. Traefik handles routing and TLS for `oef.gestaoia.cloud` (web) and `oef-api.gestaoia.cloud` (api).

## What I'd build next given more time

See the closing section of [AI-WORKFLOW.md](AI-WORKFLOW.md): projected-emissions chart, a real eval set for the extractor, BFF proxy to move the admin token to an httpOnly cookie, and a per-action "expected by year" curve so the on-track signal can degrade gracefully as deadlines slip.

## AI workflow

See [AI-WORKFLOW.md](AI-WORKFLOW.md) for the one-page write-up requested in the brief: tools used, one moment AI saved significant time, one moment I overrode the AI, and how I structured the session.
