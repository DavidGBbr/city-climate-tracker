import { SECTOR_LABELS, Sector, Summary } from "@/lib/schemas";

export type SectorBreakdownProps = {
  bySector: Summary["by_sector"];
  total: number;
};

const SECTOR_ICONS: Record<Sector, string> = {
  transport: "🚲",
  energy: "⚡",
  buildings: "🏛",
  waste: "♻",
  "land use": "🌳",
};

export function SectorBreakdown({ bySector, total }: SectorBreakdownProps) {
  const entries = Object.entries(bySector).sort(([, a], [, b]) => b - a);

  return (
    <section
      aria-labelledby="sector-heading"
      className="rounded-2xl border border-ink-line/50 bg-bg-elev shadow-soft"
    >
      <header className="flex items-baseline justify-between border-b border-ink-line/40 px-7 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-emerald-700">
            By sector
          </p>
          <h2
            id="sector-heading"
            className="mt-1 text-xl font-bold tracking-tight text-ink"
          >
            Where the reductions come from
          </h2>
        </div>
        {entries.length > 0 && (
          <p className="text-xs text-ink-mute">
            {entries.length} {entries.length === 1 ? "sector" : "sectors"} active
          </p>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="px-7 py-10 text-sm text-ink-mute">
          No actions registered yet.
        </p>
      ) : (
        <ul className="divide-y divide-ink-line/30">
          {entries.map(([sector, reduction]) => {
            const pct = total > 0 ? Math.round((reduction / total) * 100) : 0;
            const label = SECTOR_LABELS[sector as Sector] ?? sector;
            const icon = SECTOR_ICONS[sector as Sector] ?? "•";
            return (
              <li
                key={sector}
                className="grid grid-cols-[2.5rem_1fr_3.5rem] items-center gap-5 px-7 py-4 transition-colors hover:bg-emerald-50/40"
              >
                <span
                  aria-hidden
                  className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-lg"
                >
                  {icon}
                </span>

                <div className="min-w-0 space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-semibold text-ink">
                      {label}
                    </span>
                    <span className="stat text-xs text-ink-mute">
                      {reduction.toLocaleString()} t/yr
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${label} share of total reductions`}
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-1.5 overflow-hidden rounded-full bg-bg-sunk"
                  >
                    <span
                      aria-hidden="true"
                      className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <span className="stat text-right text-xl font-bold tabular-nums text-emerald-700">
                  {pct}
                  <span className="text-sm font-medium text-emerald-600/70">
                    %
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
