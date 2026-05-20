"""LangChain-powered structured extraction of climate actions from free text.

Design:
  * Structured output is enforced via Pydantic schema (ActionDraft).
  * Idempotency: same normalized text → cached ActionDraft, single LLM call.
  * Logging: every input/output transition is logged with a stable text-hash id.
  * DI: ``get_extractor`` is the FastAPI dependency; tests override it cleanly.

The chain is built lazily so that importing this module does not require a
valid ``OPENAI_API_KEY`` to be present (e.g. during pytest collection).
"""

from __future__ import annotations

import hashlib
import logging
from datetime import date
from functools import lru_cache
from typing import Any, Protocol

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from ..core.config import Settings, get_settings
from .schemas import ActionDraft

logger = logging.getLogger("climate_tracker.ai")


SYSTEM_PROMPT = (
    "You extract a single municipal climate action from free-text policy or "
    "meeting notes.\n\n"
    "Today's date is {today}. Use it to resolve relative time expressions "
    "such as 'next year', 'within two years', 'by the end of the decade'. "
    "Never emit a start_year earlier than the current year unless the text "
    "states an explicit past year.\n\n"
    "Schema constraints:\n"
    "  - title: short label, 3–80 chars (e.g. 'LED street lighting conversion')\n"
    "  - sector: one of [transport, energy, buildings, waste, land use]\n"
    "  - annual_reduction: tons of CO2 per year (numeric, non-negative)\n"
    "  - status: one of [planned, in progress, completed]\n"
    "  - start_year: 4-digit year the action begins\n\n"
    "Rules:\n"
    "  - Always emit valid JSON matching the schema.\n"
    "  - If a value is implied but not explicit, infer it from context.\n"
    "  - If the text gives no quantitative reduction figure, set "
    "annual_reduction to 0 — do NOT invent a number. The admin will edit it.\n"
    "  - Default status to 'planned' when phrasing is forward-looking.\n"
    "  - If start_year is not stated or inferable, use the current year.\n"
)


class _Chain(Protocol):
    """Minimal contract a chain must satisfy: ``invoke(payload) -> ActionDraft``."""

    def invoke(self, payload: dict[str, Any]) -> ActionDraft: ...  # pragma: no cover


def _build_chain(settings: Settings) -> _Chain:
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0,
        timeout=30,
        max_retries=2,
    ).with_structured_output(ActionDraft)
    prompt = ChatPromptTemplate.from_messages(
        [("system", SYSTEM_PROMPT), ("human", "{text}")]
    )
    return prompt | llm  # type: ignore[return-value]


def _normalize(text: str) -> str:
    return " ".join(text.strip().lower().split())


def _fingerprint(text: str) -> str:
    return hashlib.sha256(_normalize(text).encode()).hexdigest()


class ActionExtractor:
    """Extract an ``ActionDraft`` from free text with idempotency + logging."""

    def __init__(self, chain: _Chain) -> None:
        self._chain = chain
        self._cache: dict[str, ActionDraft] = {}

    def extract(self, text: str) -> ActionDraft:
        key = _fingerprint(text)
        short = key[:10]

        cached = self._cache.get(key)
        if cached is not None:
            logger.info("ai.extract.cache_hit hash=%s", short)
            return cached.model_copy(deep=True)

        logger.info("ai.extract.start hash=%s len=%d", short, len(text))
        result = self._chain.invoke({"text": text, "today": date.today().isoformat()})
        if not isinstance(result, ActionDraft):  # defensive — schema validation by LC
            result = ActionDraft.model_validate(result)
        logger.info(
            "ai.extract.ok hash=%s title=%r sector=%s reduction=%s status=%s start=%d",
            short,
            result.title,
            result.sector.value,
            result.annual_reduction,
            result.status.value,
            result.start_year,
        )
        self._cache[key] = result
        return result.model_copy(deep=True)


@lru_cache
def _build_default_extractor() -> ActionExtractor:
    return ActionExtractor(_build_chain(get_settings()))


def get_extractor() -> ActionExtractor:
    """FastAPI dependency. Tests override via ``app.dependency_overrides``."""
    return _build_default_extractor()
