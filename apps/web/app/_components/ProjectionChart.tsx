"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Action, Summary } from "@/lib/schemas";

type Props = {
  summary: Summary;
  actions: Action[];
};

type Row = {
  year: number;
  projected: number;
  target: number;
};

/**
 * Linear pacing target between the journey start (first action year) and the
 * city's target year. Mirrors the on-track formula in apps/api/app/services/summary.py
 * so the chart and the badge agree.
 */
function buildSeries(summary: Summary, actions: Action[]): Row[] {
  if (actions.length === 0) return [];

  const journeyStart = Math.min(...actions.map((a) => a.start_year));
  const end = Math.max(summary.target_year, summary.current_year);
  const horizon = summary.target_year - journeyStart;

  const rows: Row[] = [];
  for (let year = journeyStart; year <= end; year++) {
    const cumulative = actions
      .filter((a) => a.start_year <= year)
      .reduce((sum, a) => sum + a.annual_reduction, 0);

    const projected = Math.max(0, summary.baseline_emissions - cumulative);

    const targetPct =
      horizon <= 0
        ? 1
        : Math.min(1, Math.max(0, (year - journeyStart) / horizon));
    const target = Math.max(0, summary.baseline_emissions * (1 - targetPct));

    rows.push({ year, projected: Math.round(projected), target: Math.round(target) });
  }
  return rows;
}

export function ProjectionChart({ summary, actions }: Props) {
  const data = buildSeries(summary, actions);

  if (data.length === 0) {
    return (
      <section
        aria-labelledby="projection-heading"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <h2 id="projection-heading" className="text-lg font-semibold">
          Projected emissions
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          No actions registered yet — projection unavailable.
        </p>
      </section>
    );
  }

  const yMax = summary.baseline_emissions;

  return (
    <section
      aria-labelledby="projection-heading"
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-6"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h2 id="projection-heading" className="text-lg font-semibold">
          Projected emissions per year
        </h2>
        <span className="text-xs text-slate-500">
          tons CO₂/yr · baseline {yMax.toLocaleString()}
        </span>
      </header>

      <div className="h-72 w-full" role="img" aria-label="Line chart comparing projected annual emissions against the linear pacing target from the first action year through the net-zero target year">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "#475569" }}
              tickFormatter={(v) => String(v)}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#475569" }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              domain={[0, yMax]}
            />
            <Tooltip
              formatter={(value) =>
                `${Number(value).toLocaleString()} t CO₂/yr`
              }
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="projected"
              name="Projected with current actions"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Linear pacing target"
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine
              x={summary.current_year}
              stroke="#0f172a"
              strokeDasharray="2 2"
              label={{ value: "Today", position: "top", fontSize: 11, fill: "#0f172a" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500">
        Projection assumes every registered action delivers its full annual
        reduction from its start year onward. Dashed gray line shows the linear
        path to net zero between the first action and the target year.
      </p>
    </section>
  );
}
