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
      className="lg:col-span-2 rounded-2xl border border-ink-line/50 bg-bg-elev p-7 shadow-soft"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="progress-heading"
          className="text-sm font-semibold text-ink-soft"
        >
          Reductions secured vs. baseline
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          {progressPercent}% covered
        </span>
      </div>

      <p className="mt-5 flex items-baseline gap-3">
        <span className="stat text-5xl font-extrabold leading-none tracking-tight text-ink">
          {summary.total_reduction.toLocaleString()}
        </span>
        <span className="text-sm text-ink-mute">
          / <span className="stat">{summary.baseline_emissions.toLocaleString()}</span>{" "}
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
          className="relative h-2.5 overflow-visible rounded-full bg-bg-sunk"
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ${
              summary.on_track
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : "bg-gradient-to-r from-ember-400 to-ember-600"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
          {expectedPercent > 0 && expectedPercent <= 100 && (
            <span
              aria-hidden="true"
              title={`Expected pacing: ${expectedPercent}%`}
              className="absolute -top-1.5 -bottom-1.5 w-0.5 rounded-full bg-ink"
              style={{ left: `${expectedPercent}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-[11px] font-mono text-ink-mute">
          <span>0%</span>
          <span>pacing target {expectedPercent}%</span>
          <span>100%</span>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-ink-soft">
        <span className="stat font-semibold text-ink">
          {summary.remaining_to_target.toLocaleString()} t/yr
        </span>{" "}
        of further annual reductions still required to reach net zero by{" "}
        {summary.target_year}.
      </p>
    </section>
  );
}
