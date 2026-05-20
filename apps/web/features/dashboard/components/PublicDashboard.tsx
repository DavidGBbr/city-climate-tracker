"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

import { ErrorMessage } from "@/components/ui";
import { useActions } from "@/features/actions/hooks";
import { CitySelector } from "@/features/cities/components/CitySelector";
import { useCities } from "@/features/cities/hooks";
import { ActionSchema, Summary, SummarySchema } from "@/lib/schemas";

import { useSummary } from "../hooks";
import { Methodology } from "./Methodology";
import { OnTrackCard } from "./OnTrackCard";
import { ProgressCard } from "./ProgressCard";
import { ProjectionChart } from "./ProjectionChart";
import { SectorBreakdown } from "./SectorBreakdown";

export function PublicDashboard() {
  const { data: cities, isLoading: citiesLoading, error: citiesError } = useCities();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && cities && cities.length > 0) {
      setSelectedId(cities[0].id);
    }
  }, [cities, selectedId]);

  const selected = cities?.find((c) => c.id === selectedId) ?? null;

  const { data: raw, isLoading, error } = useSummary(selected?.id);
  const { data: actionsRaw } = useActions(selected?.id);

  if (citiesLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-ink-mute">
        <span className="h-2 w-2 animate-soft-pulse rounded-full bg-emerald-500" />
        <span>Loading cities…</span>
      </div>
    );
  }

  if (citiesError || !cities) {
    return <ErrorMessage>Could not load city configuration.</ErrorMessage>;
  }

  if (cities.length === 0) {
    return (
      <ErrorMessage>
        No cities are configured yet. Ask an admin to seed the database.
      </ErrorMessage>
    );
  }

  return (
    <div className="space-y-6">
      <CitySelector cities={cities} value={selectedId} onChange={setSelectedId} />

      {isLoading || !selected ? (
        <div className="text-sm text-ink-mute">Loading dashboard…</div>
      ) : error || !raw ? (
        <ErrorMessage>Could not load progress data.</ErrorMessage>
      ) : (
        <DashboardBody raw={raw} actionsRaw={actionsRaw} />
      )}
    </div>
  );
}

function DashboardBody({ raw, actionsRaw }: { raw: unknown; actionsRaw: unknown }) {
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
    <div className="reveal space-y-10">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden rounded-2xl border border-ink-line/50 bg-bg-elev bg-radial-leaf topo-bg shadow-soft">
        {/* Decorative organic blobs */}
        <span
          aria-hidden
          className="blob -right-16 -top-20 h-72 w-72 bg-emerald-200 animate-float"
        />
        <span
          aria-hidden
          className="blob -bottom-24 right-20 h-48 w-48 bg-sky-100"
        />

        <div className="relative grid gap-10 px-8 py-10 md:grid-cols-[1.6fr_1fr] md:items-center md:px-12 md:py-14">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-soft-pulse"
              />
              Live · updated {summary.current_year}
            </span>

            <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] font-extrabold leading-[1.02] tracking-tight text-ink">
              {summary.city_name}&rsquo;s journey to{" "}
              <span className="text-emerald-600">net zero</span>.
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-ink-soft">
              A live ledger of every climate action committed to bring{" "}
              <span className="font-semibold text-ink">{summary.city_name}</span>{" "}
              to carbon neutrality by{" "}
              <span className="font-semibold text-ink">
                {summary.target_year}
              </span>
              . Updated continuously as the city files new actions.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-xl border border-ink-line/50 bg-bg/60 p-5 backdrop-blur-sm">
            <Stat
              label="Baseline"
              value={summary.baseline_emissions.toLocaleString()}
              unit="t CO₂/yr"
            />
            <Stat
              label="Target"
              value={String(summary.target_year)}
              unit="net zero"
            />
            <Stat
              label="Window"
              value={String(yearsLeft)}
              unit={yearsLeft === 1 ? "year left" : "years left"}
            />
          </dl>
        </div>
      </section>

      {/* ---------- Status row ---------- */}
      <section className="grid gap-5 lg:grid-cols-3">
        <ProgressCard
          summary={summary}
          progressPercent={progressPercent}
          expectedPercent={expectedPercent}
        />
        <OnTrackCard onTrack={summary.on_track} />
      </section>

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
      <dt className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-mute">
        {label}
      </dt>
      <dd className="stat text-lg font-bold leading-none text-ink">{value}</dd>
      <dd className="text-[11px] text-ink-mute">{unit}</dd>
    </div>
  );
}
