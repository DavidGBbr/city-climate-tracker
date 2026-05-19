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

      <ProjectionChart summary={summary} actions={actions} />

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
