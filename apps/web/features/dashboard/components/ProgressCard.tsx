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
      className="lg:col-span-2 bg-bg-elev border border-ink-line/70 p-8 rounded-sharp shadow-card"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="progress-heading"
          className="eyebrow"
        >
          Reductions secured vs. baseline
        </h2>
        <span className="eyebrow text-forest-600">
          {progressPercent}% covered
        </span>
      </div>

      <p className="mt-5 flex items-baseline gap-3">
        <span className="stat font-display text-5xl font-semibold text-ink leading-none tracking-tight">
          {summary.total_reduction.toLocaleString()}
        </span>
        <span className="text-sm text-ink-mute">
          /{" "}
          <span className="stat">
            {summary.baseline_emissions.toLocaleString()}
          </span>{" "}
          t CO₂/yr
        </span>
      </p>

      <div className="mt-7 space-y-2.5">
        <div
          role="progressbar"
          aria-label={`Progress toward ${summary.city_name}'s net-zero target`}
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${progressPercent}% of baseline covered`}
          className="relative h-2 overflow-visible bg-bg-sunk"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 transition-[width] duration-700 ${
              summary.on_track ? "bg-forest-500" : "bg-ember-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
          {expectedPercent > 0 && expectedPercent <= 100 && (
            <span
              aria-hidden="true"
              title={`Expected pacing: ${expectedPercent}%`}
              className="absolute -top-1.5 -bottom-1.5 w-px bg-ink"
              style={{ left: `${expectedPercent}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-[11px] text-ink-mute font-mono">
          <span>0</span>
          <span aria-hidden>
            ▲ pacing target {expectedPercent}%
          </span>
          <span>100</span>
        </div>
      </div>

      <p className="mt-6 text-sm text-ink-soft leading-relaxed">
        <span className="stat font-medium text-ink">
          {summary.remaining_to_target.toLocaleString()} t/yr
        </span>{" "}
        of further annual reductions still required to reach net zero by{" "}
        {summary.target_year}.
      </p>
    </section>
  );
}
