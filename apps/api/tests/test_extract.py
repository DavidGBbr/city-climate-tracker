"""Tests for the LangChain-powered action extractor."""

from typing import Any

import pytest

from app.ai.extractor import ActionExtractor, get_extractor
from app.main import app
from app.models import ActionDraft, ActionStatus, Sector

PDF_EXAMPLE = (
    "The city council approved a $2M investment to convert all street lighting "
    "to LED by 2027. The energy department estimates this will cut approximately "
    "9,500 tons of CO2 per year once fully deployed. The project is currently in "
    "the planning phase."
)


def _expected_draft() -> ActionDraft:
    return ActionDraft(
        title="LED street lighting conversion",
        sector=Sector.energy,
        annual_reduction=9500,
        status=ActionStatus.planned,
        start_year=2027,
    )


class StubChain:
    """Deterministic stand-in for ``_build_chain`` output — counts invocations."""

    def __init__(self, draft: ActionDraft | None = None) -> None:
        self.calls: list[str] = []
        self._draft = draft or _expected_draft()

    def invoke(self, payload: dict[str, Any]) -> ActionDraft:
        self.calls.append(payload["text"])
        return self._draft.model_copy(deep=True)


@pytest.fixture
def stub_chain() -> StubChain:
    return StubChain()


@pytest.fixture
def stub_extractor(stub_chain) -> ActionExtractor:
    return ActionExtractor(stub_chain)


@pytest.fixture
def http_extractor(client, stub_extractor):
    """Wire the stub extractor into FastAPI for HTTP tests."""
    app.dependency_overrides[get_extractor] = lambda: stub_extractor
    return stub_extractor


# ---------- ActionExtractor unit tests ----------


def test_extractor_returns_pdf_expected_draft(stub_extractor, stub_chain):
    draft = stub_extractor.extract(PDF_EXAMPLE)
    assert draft.title == "LED street lighting conversion"
    assert draft.sector == Sector.energy
    assert draft.annual_reduction == 9500
    assert draft.status == ActionStatus.planned
    assert draft.start_year == 2027
    assert len(stub_chain.calls) == 1


def test_extractor_caches_same_text(stub_extractor, stub_chain):
    stub_extractor.extract(PDF_EXAMPLE)
    stub_extractor.extract(PDF_EXAMPLE)
    assert len(stub_chain.calls) == 1


def test_extractor_normalizes_whitespace_and_case(stub_extractor, stub_chain):
    """Idempotency: 'same' text in different casing/whitespace hits the cache."""
    stub_extractor.extract(PDF_EXAMPLE)
    stub_extractor.extract("   " + PDF_EXAMPLE.upper() + "   ")
    stub_extractor.extract(PDF_EXAMPLE.replace("  ", " "))
    assert len(stub_chain.calls) == 1


def test_extractor_recomputes_for_different_text(stub_extractor, stub_chain):
    stub_extractor.extract(PDF_EXAMPLE)
    stub_extractor.extract(PDF_EXAMPLE + " The mayor confirmed funding.")
    assert len(stub_chain.calls) == 2


def test_extractor_logs_lifecycle(stub_extractor, caplog):
    import logging

    with caplog.at_level(logging.INFO, logger="climate_tracker.ai"):
        stub_extractor.extract(PDF_EXAMPLE)
        stub_extractor.extract(PDF_EXAMPLE)

    messages = [r.getMessage() for r in caplog.records]
    assert any(m.startswith("ai.extract.start") for m in messages)
    assert any(m.startswith("ai.extract.ok") for m in messages)
    assert any(m.startswith("ai.extract.cache_hit") for m in messages)


def test_extractor_returns_defensive_copy(stub_extractor):
    """Mutating a returned draft must not poison the cache."""
    first = stub_extractor.extract(PDF_EXAMPLE)
    first.title = "tampered"
    second = stub_extractor.extract(PDF_EXAMPLE)
    assert second.title == "LED street lighting conversion"


# ---------- HTTP endpoint ----------


def test_extract_endpoint_pdf_example(client, http_extractor, stub_chain):
    response = client.post("/actions/extract", json={"text": PDF_EXAMPLE})
    assert response.status_code == 200
    body = response.json()
    assert body == {
        "title": "LED street lighting conversion",
        "sector": "energy",
        "annual_reduction": 9500,
        "status": "planned",
        "start_year": 2027,
    }
    assert len(stub_chain.calls) == 1


def test_extract_endpoint_is_idempotent_across_calls(client, http_extractor, stub_chain):
    client.post("/actions/extract", json={"text": PDF_EXAMPLE})
    client.post("/actions/extract", json={"text": PDF_EXAMPLE})
    assert len(stub_chain.calls) == 1


def test_extract_rejects_too_short_text(client, http_extractor):
    response = client.post("/actions/extract", json={"text": "too short"})
    assert response.status_code == 422
    assert response.json()["error"] == "validation_error"


def test_extract_rejects_missing_text(client, http_extractor):
    response = client.post("/actions/extract", json={})
    assert response.status_code == 422


def test_extract_does_not_persist(client, http_extractor, seeded_city):
    """Extract is a preview — admin must still POST /cities/{id}/actions to save."""
    before = client.get(f"/cities/{seeded_city.id}/actions").json()
    client.post("/actions/extract", json={"text": PDF_EXAMPLE})
    after = client.get(f"/cities/{seeded_city.id}/actions").json()
    assert len(before) == len(after)
