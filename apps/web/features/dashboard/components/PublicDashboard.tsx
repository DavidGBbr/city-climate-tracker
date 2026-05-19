"use client";

import { z } from "zod";

import { ErrorMessage } from "@/components/ui";
import { useActions } from "@/features/actions/hooks";
import { useDefaultCity } from "@/features/cities/hooks";
import { ActionSchema, Summary, SummarySchema } from "@/lib/schemas";

import { useSummary } from "../hooks";
import { Methodology } from "./Methodology";
import { OnTrackCard } from "./OnTrackCard";
import { ProgressCard } from "./ProgressCard";
import { ProjectionChart } from "./ProjectionChart";
import { SectorBreakdown } from "./SectorBreakdown";

export function PublicDashboard() {
  const { city, isLoading: cityLoading, error: cityError } = useDefaultCity();
  const { data: raw, isLoading, error } = useSummary(city?.id);
  const { data: actionsRaw } = useActions(city?.id);

  if (cityLoading || isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-ink-mute">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest-500" />
        <span className="eyebrow">Loading dashboard</span>
      </div>
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

  const actions = z.array(ActionSchema).safeParse(actionsRaw ?? []);

  return (
    <DashboardView
      summary={parsed.data}
      actions={actions.success ? actions.data : []}
    />
  );
}

function DashboardView({
  summary,
  actions,
}: {
  summary: Summary;
  actions: z.infer<typeof ActionSchema>[];
}) {
  const progressPercent = Math.min(100, Math.round(summary.progress_pct * 100));
  const expectedPercent = Math.min(
    100,
    Math.round(summary.expected_progress_pct * 100),
  );
  const yearsLeft = Math.max(0, summary.target_year - summary.current_year);

  return (
    <div className="reveal space-y-14">
      {/* ---------- Editorial hero ---------- */}
      <header className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end pb-2">
        <div className="space-y-5">
          <p className="eyebrow flex items-center gap-3">
            <span className="h-px w-8 bg-forest-500" aria-hidden />
            City dossier · {summary.current_year}
          </p>
          <h1 className="font-display text-[clamp(2.75rem,6vw,4.75rem)] font-semibold leading-[0.95] tracking-tight text-ink">
            {summary.city_name}.
          </h1>
          <p className="max-w-xl text-base text-ink-soft leading-relaxed">
            A live ledger of every climate action committed to bring{" "}
            <span className="font-medium text-ink">{summary.city_name}</span> to
            net-zero by{" "}
            <span className="font-medium text-ink">{summary.target_year}</span>.
            Updated continuously as the city files new actions.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-x-8 gap-y-1 text-right md:text-left border-l border-ink-line/70 md:pl-8 pt-2">
          <Stat
            label="Baseline"
            value={summary.baseline_emissions.toLocaleString()}
            unit="t CO₂/yr"
          />
          <Stat label="Target" value={String(summary.target_year)} unit="net zero" />
          <Stat
            label="Window"
            value={String(yearsLeft)}
            unit={yearsLeft === 1 ? "year left" : "years left"}
          />
        </dl>
      </header>

      <div className="rule-leaf" aria-hidden />

      {/* ---------- Status row: progress + verdict ---------- */}
      <section className="grid gap-6 lg:grid-cols-3">
        <ProgressCard
          summary={summary}
          progressPercent={progressPercent}
          expectedPercent={expectedPercent}
        />
        <OnTrackCard onTrack={summary.on_track} />
      </section>

      {/* ---------- Projection chart ---------- */}
      <ProjectionChart summary={summary} actions={actions} />

      {/* ---------- Sector breakdown ---------- */}
      <SectorBreakdown
        bySector={summary.by_sector}
        total={summary.total_reduction}
      />

      {/* ---------- Methodology ---------- */}
      <Methodology
        currentYear={summary.current_year}
        targetYear={summary.target_year}
        expectedPercent={expectedPercent}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow">{label}</dt>
      <dd className="stat text-xl font-medium text-ink leading-none">
        {value}
      </dd>
      <dd className="text-[11px] text-ink-mute">{unit}</dd>
    </div>
  );
}
