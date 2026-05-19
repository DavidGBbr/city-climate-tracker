import { SECTOR_LABELS, Sector, Summary } from "@/lib/schemas";

export type SectorBreakdownProps = {
  bySector: Summary["by_sector"];
  total: number;
};

export function SectorBreakdown({ bySector, total }: SectorBreakdownProps) {
  const entries = Object.entries(bySector).sort(([, a], [, b]) => b - a);

  return (
    <section
      aria-labelledby="sector-heading"
      className="bg-bg-elev border border-ink-line/70 rounded-sharp shadow-card"
    >
      <header className="px-8 pt-7 pb-6 border-b border-ink-line/70 flex items-baseline justify-between">
        <div>
          <p className="eyebrow">By sector</p>
          <h2
            id="sector-heading"
            className="font-display text-2xl font-semibold text-ink tracking-tight mt-1"
          >
            Where the reductions come from
          </h2>
        </div>
        {entries.length > 0 && (
          <p className="eyebrow text-ink-mute">
            {entries.length} {entries.length === 1 ? "sector" : "sectors"}
          </p>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="px-8 py-12 text-sm text-ink-mute">
          No actions registered yet.
        </p>
      ) : (
        <ul className="divide-y divide-ink-line/60">
          {entries.map(([sector, reduction], idx) => {
            const pct = total > 0 ? Math.round((reduction / total) * 100) : 0;
            const label = SECTOR_LABELS[sector as Sector] ?? sector;
            return (
              <li
                key={sector}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-6 px-8 py-5"
              >
                <span className="stat text-xs text-ink-mute tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="space-y-2 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-display text-base font-medium text-ink">
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
                    className="h-[3px] overflow-hidden bg-bg-sunk"
                  >
                    <span
                      aria-hidden="true"
                      className="block h-full bg-forest-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <span className="stat font-display text-2xl font-semibold text-ink tabular-nums w-14 text-right">
                  {pct}
                  <span className="text-sm text-ink-mute font-sans font-normal">
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
