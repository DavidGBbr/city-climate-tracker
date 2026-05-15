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
