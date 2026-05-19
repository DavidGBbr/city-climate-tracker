from dataclasses import dataclass
from uuid import UUID


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
