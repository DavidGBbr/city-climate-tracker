# Architecture Decisions

Short log of the load-bearing choices made during the exercise and the reasoning behind each. Companion to `AI-WORKFLOW.md` (which covers *how I used AI*); this doc covers *what the system is*.

## Stack

**FastAPI + SQLModel + PostgreSQL + Next.js 14 (App Router) + Tailwind + SWR.**

- The brief mentions OEF uses Next.js/React/TS/PostgreSQL — I matched the frontend stack and database.
- Python on the API because the LLM ecosystem (LangChain, pydantic) is most mature there, and the structured-output story (`with_structured_output(ActionDraft)`) removes a whole class of JSON-parsing bugs.
- SQLModel over raw SQLAlchemy because the same Pydantic model doubles as ORM + response schema with a `Read` variant, halving the boilerplate.
- SWR over TanStack Query because the data graph is small and SWR's cache-key conventions are obvious in code review.

## Identity & IDs

UUIDs everywhere (`uuid.uuid4`), not autoincrement integers. Makes seeds idempotent (we can assert a fixed id), survives multi-city sharding later, and stops citizens from enumerating `/cities/1`, `/cities/2`.

## Soft delete for cities

Cities have a `deleted_at` timestamp. Archived cities are excluded from public endpoints (`GET /cities`) but reachable via `GET /admin/cities` and `POST /cities/:id/restore`.

- Why soft delete: a city's emissions ledger is auditable history. A climate team archiving the wrong city shouldn't lose the action log.
- Action mutations on archived cities are blocked at the router level; the summary endpoint hides them too. Tests in `tests/test_archived_constraints.py` lock this contract.
- Trade-off: every active query needs a `filter_active` flag. Centralized in `get_or_404` and a `active_cities()` helper so it's hard to forget.

## "On track" formula

Pacing is linear between **the earliest action's `start_year`** and the city's `target_year`, comparing **cumulative annual reduction across all actions** (regardless of status) against the linearly expected reduction at the current year.

- Default that the AI proposed: count only `completed` actions and pace from a fixed program year. Rejected because (a) a public dashboard should reflect commitments, not just shipped work, and (b) pacing from a fixed year makes a city look fine for years and then suddenly flip red.
- Degenerate cases handled explicitly: no actions, baseline of zero, target year already reached, target year before the journey start. Each has an assertion in `tests/test_summary.py`.
- Documented in the module docstring of `apps/api/app/services/summary.py` so the next person doesn't "fix" it back to the naive formula.

## AI extractor

`apps/api/app/ai/extractor.py` is a LangChain chain calling `with_structured_output(ActionDraft)`, wrapped in:

1. An in-memory idempotency cache keyed on a SHA256 of the *normalized* input text (whitespace collapsed, lowercased) — same paragraph twice = one LLM call.
2. A `_Chain` Protocol so tests inject a stub. The whole test suite runs offline without an API key.
3. Defensive `model_copy(deep=True)` on the cached return value so a mutating caller can't poison the cache.
4. Lazy chain construction so `pytest` collection doesn't require `OPENAI_API_KEY`.

Trade-off: in-memory cache means it resets on container restart and doesn't shard across replicas. Fine for one VPS; a real deployment would back this with Redis.

## Auth

Single shared admin password → POST `/auth/login` returns a short-lived JWT → client stores it in a `SameSite=Lax` cookie (not httpOnly).

- Why not httpOnly: the cookie doubles as (a) a flag for the Next.js middleware to gate `/admin/*` navigation, and (b) the token client-side SWR forwards as `Authorization: Bearer ...` to the API. A proper BFF proxy would let us go httpOnly; out of scope for a 4-hour build.
- Why single password: the brief says "the climate team" — a shared password matches the user mental model. Easy to swap for OIDC later because the only thing that knows about passwords is `auth.py`.
- The Next.js middleware is intentionally opaque to the JWT contents — it only checks presence of the cookie. Signature verification happens on the API side via `require_admin`. Two gates, neither redundant: middleware blocks UI navigation, API blocks mutations even if the UI is bypassed.

## Login flow gotcha (fixed)

The first version used `router.replace(next); router.refresh()` after setting the cookie. Under prod HTTPS the client-side RSC fetch occasionally raced ahead of the cookie write — middleware redirected back to `/admin/login`, the `submitting` flag stayed true (it's only cleared in the catch branch), and the page hung in "Signing in…" until the user refreshed. Replaced with `window.location.assign(next)` to force a clean full-page navigation; the cookie is unambiguously visible to middleware on the next request.

## Error envelope

All FastAPI errors return `{ "error": "<code>", "message": "<human>", "details"?: ... }` via a global exception handler. The web `ApiError` class round-trips this so SWR's `error.message` is always citizen-readable.

## Testing posture

- API: 80 tests, all green. Hits a real Postgres in CI (not SQLite, not mocks) — the brief says we care about real data behavior, and the soft-delete unique index requires Postgres-specific semantics.
- Web: lint + typecheck + production build in CI. No component tests — given 4 hours, integration confidence came from the API test suite and manual smoke testing.

## Deployment

GitHub Actions on push to `main`: build images, SSH into VPS, `docker compose up -d`, wait for `https://oef.gestaoia.cloud/` to return 200. Traefik handles routing and TLS via Let's Encrypt for both web and api subdomains. Alembic runs `upgrade head` on container start, so schema migrations happen automatically; rollback is `docker compose pull <previous-tag>`.

## What I deliberately skipped

- **Charts** — the math is in `summary.py` but a Recharts component would be 30 min of UI polish, not new capability.
- **Per-action contribution curves** (an action starting in 2026 contributes 0 in 2025) — currently we sum `annual_reduction` flat. Acceptable for the dashboard signal; matters for a projected-emissions line chart.
- **Eval set for the extractor** — 10–20 hand-labeled paragraphs would let us track regression as the prompt or model evolves. Listed in the write-up as next-on-the-list.
- **Multi-tenant auth** — a single shared admin matches the brief; per-user roles would require a real identity provider.
