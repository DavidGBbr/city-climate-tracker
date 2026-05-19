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
 * city's target year. Mirrors the on-track formula in apps/api/app/summary/service.py
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
        className="bg-bg-elev border border-ink-line/70 p-8 rounded-sharp shadow-card"
      >
        <p className="eyebrow">Projection</p>
        <h2
          id="projection-heading"
          className="font-display text-2xl font-semibold text-ink mt-1"
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
      className="bg-bg-elev border border-ink-line/70 rounded-sharp shadow-card"
    >
      <header className="flex items-baseline justify-between px-8 pt-7 pb-2">
        <div>
          <p className="eyebrow">Trajectory</p>
          <h2
            id="projection-heading"
            className="font-display text-2xl font-semibold text-ink tracking-tight mt-1"
          >
            Projected emissions per year
          </h2>
        </div>
        <span className="eyebrow text-ink-mute">
          tons CO₂/yr · baseline{" "}
          <span className="stat text-ink">{yMax.toLocaleString()}</span>
        </span>
      </header>

      <div
        className="h-72 w-full px-4 pb-6"
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
                <stop offset="0%" stopColor="#2f8042" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2f8042" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#dcdfd6"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "#7a8a83", fontFamily: "var(--font-mono)" }}
              tickFormatter={(v) => String(v)}
              axisLine={{ stroke: "#dcdfd6" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#7a8a83", fontFamily: "var(--font-mono)" }}
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
                borderRadius: 2,
                border: "1px solid #dcdfd6",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                background: "#ffffff",
              }}
              cursor={{ stroke: "#0f1f1c", strokeDasharray: "2 2" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 11,
                paddingTop: 8,
                fontFamily: "var(--font-sans)",
                color: "#7a8a83",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
              iconType="plainline"
            />
            <Area
              type="monotone"
              dataKey="projected"
              name="Projected with current actions"
              stroke="#2f8042"
              fill="url(#projGrad)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="target"
              name="Linear pacing target"
              stroke="#0f1f1c"
              strokeDasharray="3 4"
              strokeWidth={1.25}
              dot={false}
            />
            <ReferenceLine
              x={summary.current_year}
              stroke="#0f1f1c"
              strokeWidth={1}
              label={{
                value: "TODAY",
                position: "top",
                fontSize: 10,
                fill: "#0f1f1c",
                fontFamily: "var(--font-sans)",
                letterSpacing: "0.18em",
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="px-8 pb-6 text-xs text-ink-mute leading-relaxed border-t border-ink-line/60 pt-4">
        Projection assumes every registered action delivers its full annual
        reduction from its start year onward. The dashed line traces the linear
        path to net zero between the first action and the target year.
      </p>
    </section>
  );
}
