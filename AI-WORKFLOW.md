# AI Workflow Write-up

## 1. Tools and general workflow

- **Claude Code (CLI)** as the primary driver — long-running session with full repo context.
- **Cursor** for quick spot edits when I already knew exactly what to change and didn't need the model to discover the file.
- **GitHub Copilot** off during this exercise — too noisy when working in Claude Code.

Workflow shape: one vertical slice per commit (bootstrap → models → CRUD → AI → web → dashboard → CI). Each slice was: plan in chat → confirm the contract → write the failing test myself when the logic was load-bearing → let the agent implement → review the diff → commit. I treated Claude Code as a fast junior with a great memory, not as an autopilot.

## 2. One moment where AI saved significant time

Scaffolding `apps/api/app/ai/extractor.py`. I prompted for "a LangChain chain that takes free text and returns an `ActionDraft` (the Pydantic model you already have), with an idempotency cache keyed on normalized text and INFO logs on every transition." In one turn Claude produced:

- `with_structured_output(ActionDraft)` to force schema-valid output (no fragile JSON parsing)
- A `_Chain` Protocol so tests can inject a stub
- SHA256 fingerprint of normalized text → in-memory cache (`test_extractor_caches_same_text`, `test_extractor_normalizes_whitespace_and_case`)
- Defensive `model_copy(deep=True)` on every return so a caller mutating a draft can't poison the cache (`test_extractor_returns_defensive_copy`)
- Lazy chain construction so `pytest` collection doesn't require a real API key

Why it was good: the cache + Protocol + dependency-override pattern is exactly what made the test suite 100% offline. I would have written the same thing eventually, but it would have taken three iterations to land on the Protocol-based stub.

## 3. One moment where I overrode the AI

The default the model wanted for the "on track" formula was: `expected = baseline * ((current_year - target_program_start) / horizon)` using a fixed program start year, *and* it counted only `status == "completed"` actions toward `total_reduction`. Both felt wrong for a public dashboard.

I caught it by writing out the test cases against the Greenville seed before reviewing the implementation: with that formula, a city would look "on track" for years just because no time had passed, then suddenly flip to red. I rewrote the rule in `apps/api/app/services/summary.py`:

- `journey_start = min(start_year of any action)` — the pacing clock starts when the city actually begins acting, not at some arbitrary program year.
- **All actions count regardless of status** — a dashboard meant for citizens should reflect committed commitments, not just shipped ones. Documented this explicitly in the module docstring so the next reader doesn't "fix" it back.
- Linear pacing between `journey_start` and `target_year`, with explicit handling for degenerate configs (no actions, zero baseline, target already reached).

The result: Greenville reads "off track" (25.6% covered vs 30.77% expected) — which is the right signal, not the flattering one.

## 4. How I structured the session

- **Context up front**: pinned the brief PDF and the sample JSON in the conversation. Re-pasted the LED-streetlight example whenever I touched the extractor — it's the test fixture (`PDF_EXAMPLE` in `test_extract.py`) so it's the contract.
- **Locked decisions early** before writing code: stack (FastAPI + SQLModel + Postgres on the API; Next.js 14 + Tailwind + SWR + Zod on the web), id strategy (UUIDs), error envelope (`{error, message}` from global FastAPI handlers), sectors and statuses as Python enums mirrored by Zod enums.
- **Tests-first on the load-bearing pieces**: I wrote the extractor tests in the main session (PDF example, idempotency under whitespace/case, defensive copy, dependency override) before letting the agent flesh out the implementation. The agent implemented against tests it didn't author.
- **Vertical slices** as the work unit. Every commit message describes a feature you can demo. No "wip" commits, no refactors-disguised-as-features.
- **CI as the second pair of eyes**: `.github/workflows` runs pytest on the API and lint/type-check/build on the web. If CI is green, the diff is mergeable; the AI's "looks good" is not the verdict.

## What I'd improve given more time

- **Per-action ramp-up curves** for the projection chart — today every action contributes its full `annual_reduction` from `start_year` onward; real rollouts ramp up over a few years. Cheapest honest fix: an optional `ramp_years` field.
- **Real eval set for the extractor** — 10–20 paragraphs with hand-labeled drafts to track regression as the prompt or model changes.
- **BFF proxy** to move the admin token to an httpOnly cookie — today it's `SameSite=Lax` but readable from JS so the SWR layer can forward it as `Authorization: Bearer`. Acceptable for a single-admin demo; not for production.
- **Per-user roles** instead of a single shared password — needs a real identity provider (OIDC).
