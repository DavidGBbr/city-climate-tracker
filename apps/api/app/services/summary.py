"""City progress summary — pure functions for on-track calculation.

On-track formula (linear pacing):

  journey_start    = min(start_year of any action) for the city
  expected_pct(y)  = clip((y - journey_start) / (target_year - journey_start), 0, 1)
  expected_red(y)  = baseline_emissions * expected_pct(y)
  on_track(y)      = total_reduction >= expected_red(y)

If a city has no actions, on_track is False unless baseline is zero
(nothing to reduce) or the target has already been reached.

All actions are counted regardless of status — they represent committed
or projected annual reductions and the public dashboard is intentionally
optimistic about commitments.
"""

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from ..models import Action, City


@dataclass
class ProgressSummary:
    city_id: UUID
    city_name: str
    baseline_emissions: float
    target_year: int
    current_year: int
    total_reduction: float
    remaining_to_target: float
    progress_pct: float
    expected_progress_pct: float
    on_track: bool
    by_sector: dict[str, float]
    action_count: int


def current_year_utc() -> int:
    return datetime.now(timezone.utc).year


def _expected_progress_pct(
    target_year: int,
    current_year: int,
    journey_start: int | None,
) -> float:
    if journey_start is None:
        # No actions ever — only meaningful for the zero-baseline edge case
        return 1.0 if current_year >= target_year else 0.0
    if current_year <= journey_start:
        return 0.0
    if current_year >= target_year:
        return 1.0
    if target_year <= journey_start:
        # Degenerate config (journey starts at/after target), past both → done
        return 1.0
    return (current_year - journey_start) / (target_year - journey_start)


def build_summary(
    city: City,
    actions: list[Action],
    as_of_year: int | None = None,
) -> ProgressSummary:
    current_year = as_of_year if as_of_year is not None else current_year_utc()

    total_reduction = sum(a.annual_reduction for a in actions)
    by_sector_raw: dict[str, float] = defaultdict(float)
    for a in actions:
        by_sector_raw[a.sector.value] += a.annual_reduction
    by_sector = dict(by_sector_raw)

    journey_start = min((a.start_year for a in actions), default=None)
    expected_pct = _expected_progress_pct(city.target_year, current_year, journey_start)
    expected_reduction = city.baseline_emissions * expected_pct

    progress_pct = (
        total_reduction / city.baseline_emissions if city.baseline_emissions > 0 else 0.0
    )

    if not actions and city.baseline_emissions > 0:
        # No actions + positive baseline → reduction is impossible, so off track
        on_track = False
    else:
        on_track = total_reduction >= expected_reduction

    return ProgressSummary(
        city_id=city.id,
        city_name=city.name,
        baseline_emissions=city.baseline_emissions,
        target_year=city.target_year,
        current_year=current_year,
        total_reduction=total_reduction,
        remaining_to_target=max(0.0, city.baseline_emissions - total_reduction),
        progress_pct=round(progress_pct, 4),
        expected_progress_pct=round(expected_pct, 4),
        on_track=on_track,
        by_sector=by_sector,
        action_count=len(actions),
    )
