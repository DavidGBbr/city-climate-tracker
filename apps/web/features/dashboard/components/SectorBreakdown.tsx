import { SECTOR_LABELS, Sector, Summary } from "@/lib/schemas";

export type SectorBreakdownProps = {
  bySector: Summary["by_sector"];
  total: number;
};

export function SectorBreakdown({ bySector, total }: SectorBreakdownProps) {
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
