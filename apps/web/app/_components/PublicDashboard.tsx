"use client";

import { ErrorMessage } from "@/components/forms";
import { useDefaultCity, useSummary } from "@/lib/hooks";
import {
  SECTOR_LABELS,
  Sector,
  Summary,
  SummarySchema,
} from "@/lib/schemas";

export function PublicDashboard() {
  const { city, isLoading: cityLoading, error: cityError } = useDefaultCity();
  const { data: raw, isLoading, error } = useSummary(city?.id);

  if (cityLoading || isLoading) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-slate-500">
        Loading dashboard…
      </p>
    );
  }

  if (cityError || !city) {
    return <ErrorMessage>Could not load city configuration.</ErrorMessage>;
  }

  if (error || !raw) {
    return <ErrorMessage>Could not load progress data.</ErrorMessage>;
  }

  const parsed = SummarySchema.safeParse(raw);
  if (!parsed.success) {
    return (
      <ErrorMessage>
        The API returned an unexpected payload shape. Try refreshing.
      </ErrorMessage>
    );
  }

  return <DashboardView summary={parsed.data} />;
}

function DashboardView({ summary }: { summary: Summary }) {
  const progressPercent = Math.min(100, Math.round(summary.progress_pct * 100));
  const expectedPercent = Math.min(
    100,
    Math.round(summary.expected_progress_pct * 100)
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {summary.city_name}
        </h1>
        <p className="text-slate-600">
          Net-zero target by{" "}
          <span className="font-medium text-slate-900">
            {summary.target_year}
          </span>{" "}
          · baseline{" "}
          <span className="font-medium text-slate-900">
            {summary.baseline_emissions.toLocaleString()} t CO₂/yr
          </span>{" "}
          · as of{" "}
          <span className="font-medium text-slate-900">
            {summary.current_year}
          </span>
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <ProgressCard
          summary={summary}
          progressPercent={progressPercent}
          expectedPercent={expectedPercent}
        />
        <OnTrackCard onTrack={summary.on_track} />
      </div>

      <SectorBreakdown
        bySector={summary.by_sector}
        total={summary.total_reduction}
      />

      <Methodology
        currentYear={summary.current_year}
        targetYear={summary.target_year}
        expectedPercent={expectedPercent}
      />
    </div>
  );
}

type ProgressCardProps = {
  summary: Summary;
  progressPercent: number;
  expectedPercent: number;
};

function ProgressCard({
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

function OnTrackCard({ onTrack }: { onTrack: boolean }) {
  const styles = onTrack
    ? {
        wrapper: "border-emerald-200 bg-emerald-50",
        dot: "bg-emerald-500",
        title: "text-emerald-900",
        body: "text-emerald-800",
      }
    : {
        wrapper: "border-red-200 bg-red-50",
        dot: "bg-red-500",
        title: "text-red-900",
        body: "text-red-800",
      };

  return (
    <section
      aria-labelledby="status-heading"
      className={`flex flex-col justify-center space-y-2 rounded-lg border p-6 ${styles.wrapper}`}
    >
      <h2 id="status-heading" className="text-sm font-medium text-slate-500">
        Status
      </h2>
      <p
        role="status"
        aria-live="polite"
        className={`flex items-center gap-2 text-xl font-semibold ${styles.title}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-3 w-3 rounded-full ${styles.dot}`}
        />
        {onTrack ? "On track" : "Off track"}
      </p>
      <p className={`text-sm ${styles.body}`}>
        {onTrack
          ? "Current commitments meet or exceed the linear pacing target for this year."
          : "Current commitments lag behind the linear pacing target for this year."}
      </p>
    </section>
  );
}

function SectorBreakdown({
  bySector,
  total,
}: {
  bySector: Summary["by_sector"];
  total: number;
}) {
  const entries = Object.entries(bySector).sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return (
      <section
        aria-labelledby="sector-heading"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <h2 id="sector-heading" className="text-lg font-semibold">
          By sector
        </h2>
        <p className="mt-2 text-sm text-slate-500">No actions registered.</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="sector-heading"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <h2 id="sector-heading" className="text-lg font-semibold">
        By sector
      </h2>
      <ul className="space-y-3">
        {entries.map(([sector, reduction]) => {
          const pct = total > 0 ? Math.round((reduction / total) * 100) : 0;
          const label = SECTOR_LABELS[sector as Sector] ?? sector;
          return (
            <li key={sector} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="tabular-nums text-slate-500">
                  {reduction.toLocaleString()} t/yr · {pct}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${label} share of total reductions`}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-slate-100"
              >
                <span
                  aria-hidden="true"
                  className="block h-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Methodology({
  currentYear,
  targetYear,
  expectedPercent,
}: {
  currentYear: number;
  targetYear: number;
  expectedPercent: number;
}) {
  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <summary className="cursor-pointer font-medium text-slate-700">
        How is &ldquo;On track&rdquo; calculated?
      </summary>
      <div className="mt-2 space-y-2">
        <p>
          On track means the sum of annual reductions across all registered
          climate actions meets or exceeds the linear pacing target for the
          current year.
        </p>
        <p>
          As of {currentYear}, with the target year set to {targetYear}, the
          pacing target is{" "}
          <span className="font-medium text-slate-800">
            {expectedPercent}%
          </span>{" "}
          of the baseline.
        </p>
        <p className="text-xs text-slate-500">
          All actions count toward the total regardless of status — the
          dashboard is intentionally optimistic about commitments.
        </p>
      </div>
    </details>
  );
}
