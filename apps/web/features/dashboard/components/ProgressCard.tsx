import type { Summary } from "@/lib/schemas";

export type ProgressCardProps = {
  summary: Summary;
  progressPercent: number;
  expectedPercent: number;
};

export function ProgressCard({
  summary,
  progressPercent,
  expectedPercent,
}: ProgressCardProps) {
  return (
    <section
      aria-labelledby="progress-heading"
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2"
    >
      <h2 id="progress-heading" className="text-sm font-medium text-slate-500">
        Reductions vs baseline
      </h2>
      <p className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums text-slate-900">
          {summary.total_reduction.toLocaleString()}
        </span>
        <span className="text-sm text-slate-500">
          / {summary.baseline_emissions.toLocaleString()} t CO₂/yr
        </span>
      </p>
      <div
        role="progressbar"
        aria-label={`Progress toward ${summary.city_name}'s net-zero target`}
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${progressPercent}% of baseline covered`}
        className="relative h-3 overflow-hidden rounded-full bg-slate-100"
      >
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 ${
            summary.on_track ? "bg-emerald-500" : "bg-red-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
        {/* Expected pacing marker */}
        {expectedPercent > 0 && expectedPercent <= 100 && (
          <span
            aria-hidden="true"
            title={`Expected pacing: ${expectedPercent}%`}
            className="absolute inset-y-0 w-px bg-slate-700"
            style={{ left: `${expectedPercent}%` }}
          />
        )}
      </div>
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">{progressPercent}%</span>{" "}
        of baseline covered ·{" "}
        <span className="font-medium text-slate-700">
          {summary.remaining_to_target.toLocaleString()} t/yr
        </span>{" "}
        remaining to net zero · pacing target {expectedPercent}% (vertical line)
      </p>
    </section>
  );
}
