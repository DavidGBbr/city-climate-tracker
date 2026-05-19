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

    rows.push({
      year,
      projected: Math.round(projected),
      target: Math.round(target),
    });
  }
  return rows;
}

export function ProjectionChart({ summary, actions }: Props) {
  const data = buildSeries(summary, actions);

  if (data.length === 0) {
    return (
      <section
        aria-labelledby="projection-heading"
        className="rounded-2xl border border-ink-line/50 bg-bg-elev p-7 shadow-soft"
      >
        <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-emerald-700">
          Projection
        </p>
        <h2
          id="projection-heading"
          className="mt-1 text-xl font-bold tracking-tight text-ink"
        >
          No actions registered yet
        </h2>
        <p className="mt-2 text-sm text-ink-mute">
          Add the first action to unlock the projection.
        </p>
      </section>
    );
  }

  const yMax = summary.baseline_emissions;

  return (
    <section
      aria-labelledby="projection-heading"
      className="rounded-2xl border border-ink-line/50 bg-bg-elev shadow-soft"
    >
      <header className="flex items-baseline justify-between border-b border-ink-line/40 px-7 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-emerald-700">
            Trajectory
          </p>
          <h2
            id="projection-heading"
            className="mt-1 text-xl font-bold tracking-tight text-ink"
          >
            Projected emissions per year
          </h2>
        </div>
        <span className="text-xs text-ink-mute">
          tons CO₂/yr · baseline{" "}
          <span className="stat text-ink">{yMax.toLocaleString()}</span>
        </span>
      </header>

      <div
        className="h-72 w-full px-4 py-4"
        role="img"
        aria-label="Line chart comparing projected annual emissions against the linear pacing target from the first action year through the net-zero target year"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 18, right: 24, bottom: 8, left: 8 }}
          >
            <defs>
              <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#dbe5d8"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{
                fontSize: 11,
                fill: "#7a8a83",
                fontFamily: "var(--font-mono)",
              }}
              tickFormatter={(v) => String(v)}
              axisLine={{ stroke: "#dbe5d8" }}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: "#7a8a83",
                fontFamily: "var(--font-mono)",
              }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              domain={[0, yMax]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) =>
                `${Number(value).toLocaleString()} t CO₂/yr`
              }
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #dbe5d8",
                fontSize: 12,
                fontFamily: "var(--font-sans)",
                background: "#ffffff",
                boxShadow: "0 8px 24px -12px rgba(14, 31, 23, 0.12)",
              }}
              cursor={{ stroke: "#10b981", strokeDasharray: "3 3" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 8,
                fontFamily: "var(--font-sans)",
                color: "#395048",
              }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="projected"
              name="Projected with current actions"
              stroke="#10b981"
              fill="url(#projGrad)"
              strokeWidth={2.5}
              dot={{ r: 0 }}
              activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Linear pacing target"
              stroke="#395048"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
            <ReferenceLine
              x={summary.current_year}
              stroke="#0e1f17"
              strokeWidth={1}
              label={{
                value: "Today",
                position: "top",
                fontSize: 11,
                fill: "#0e1f17",
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="border-t border-ink-line/30 px-7 py-4 text-xs leading-relaxed text-ink-mute">
        Projection assumes every registered action delivers its full annual
        reduction from its start year onward. The dashed line traces the linear
        path to net zero between the first action and the target year.
      </p>
    </section>
  );
}
