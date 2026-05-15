"""Tests for the city summary / on-track calculation."""

from uuid import uuid4

import pytest

from app.models import Action, ActionStatus, City, Sector
from app.services.summary import build_summary


def _city(**overrides) -> City:
    base = {
        "name": "Testville",
        "baseline_emissions": 100_000,
        "target_year": 2030,
    }
    base.update(overrides)
    return City(**base)


def _action(start_year: int, reduction: float, sector: Sector = Sector.energy) -> Action:
    return Action(
        city_id=uuid4(),
        title=f"action-{start_year}",
        sector=sector,
        annual_reduction=reduction,
        status=ActionStatus.planned,
        start_year=start_year,
    )


# ---------- pure logic ----------


def test_no_actions_before_target_is_off_track():
    summary = build_summary(_city(), actions=[], as_of_year=2025)
    assert summary.total_reduction == 0
    assert summary.on_track is False
    assert summary.action_count == 0
    assert summary.by_sector == {}


def test_no_actions_past_target_with_zero_baseline_is_on_track():
    summary = build_summary(_city(baseline_emissions=0), actions=[], as_of_year=2025)
    assert summary.on_track is True


def test_full_baseline_covered_is_on_track():
    actions = [_action(2024, 100_000)]
    summary = build_summary(_city(), actions, as_of_year=2025)
    # journey_start=2024, year=2025, target=2030 → expected_pct = 1/6 ≈ 0.1667
    # required = 100000 * 1/6 ≈ 16666 ; total = 100000 → on track
    assert summary.on_track is True
    assert summary.progress_pct == 1.0


def test_partial_coverage_off_pace_is_off_track():
    # journey 2020→2030, halfway = 2025, need 50% covered
    actions = [_action(2020, 30_000)]
    summary = build_summary(_city(), actions, as_of_year=2025)
    assert summary.expected_progress_pct == 0.5
    assert summary.on_track is False


def test_partial_coverage_ahead_of_pace_is_on_track():
    actions = [_action(2020, 60_000)]
    summary = build_summary(_city(), actions, as_of_year=2025)
    assert summary.on_track is True


def test_past_target_requires_full_baseline():
    actions = [_action(2020, 99_999)]
    summary = build_summary(_city(target_year=2024), actions, as_of_year=2025)
    assert summary.expected_progress_pct == 1.0
    assert summary.on_track is False  # 99999 < 100000


def test_by_sector_groups_correctly():
    actions = [
        _action(2024, 10_000, Sector.transport),
        _action(2024, 20_000, Sector.transport),
        _action(2024, 5_000, Sector.energy),
        _action(2024, 8_000, Sector.land_use),
    ]
    summary = build_summary(_city(), actions, as_of_year=2025)
    assert summary.by_sector == {
        "transport": 30_000,
        "energy": 5_000,
        "land use": 8_000,
    }


def test_remaining_to_target_floors_at_zero():
    actions = [_action(2020, 200_000)]
    summary = build_summary(_city(), actions, as_of_year=2025)
    assert summary.remaining_to_target == 0.0


def test_current_year_before_journey_is_on_track():
    actions = [_action(2030, 10_000)]
    summary = build_summary(_city(), actions, as_of_year=2025)
    assert summary.expected_progress_pct == 0.0
    assert summary.on_track is True


# ---------- HTTP endpoint ----------


def test_summary_endpoint_returns_greenville(client, seeded_city):
    response = client.get(f"/cities/{seeded_city.id}/summary?as_of=2026")
    assert response.status_code == 200
    body = response.json()
    assert body["city_id"] == str(seeded_city.id)
    assert body["city_name"] == "Greenville"
    assert body["baseline_emissions"] == 500_000
    assert body["target_year"] == 2035
    assert body["current_year"] == 2026
    assert body["action_count"] == 6
    # 12000+45000+18000+8000+15000+30000 = 128000
    assert body["total_reduction"] == 128_000
    assert body["by_sector"] == {
        "transport": 42_000,
        "energy": 45_000,
        "buildings": 18_000,
        "waste": 8_000,
        "land use": 15_000,
    }


def test_summary_greenville_off_track_red(client, seeded_city):
    body = client.get(f"/cities/{seeded_city.id}/summary?as_of=2026").json()
    assert body["on_track"] is False
    assert body["expected_progress_pct"] == pytest.approx(0.3077, abs=0.001)


def test_summary_greenville_on_track_green_after_long_runway(client, seeded_city):
    body = client.get(f"/cities/{seeded_city.id}/summary?as_of=2022").json()
    assert body["on_track"] is True


def test_summary_404(client):
    response = client.get(f"/cities/{uuid4()}/summary")
    assert response.status_code == 404


def test_summary_uses_current_year_when_no_as_of(client, seeded_city):
    body = client.get(f"/cities/{seeded_city.id}/summary").json()
    assert body["current_year"] >= 2024
