export type MethodologyProps = {
  currentYear: number;
  targetYear: number;
  expectedPercent: number;
};

export function Methodology({
  currentYear,
  targetYear,
  expectedPercent,
}: MethodologyProps) {
  return (
    <details className="group rounded-2xl border border-ink-line/50 bg-bg-elev/60 px-6 py-4 shadow-soft">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-ink">
            How &ldquo;on track&rdquo; is calculated
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-emerald-700 transition-transform duration-300 group-open:rotate-180"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </summary>
      <div className="mt-5 grid gap-5 border-t border-ink-line/40 pt-5 text-sm leading-relaxed text-ink-soft md:grid-cols-2">
        <p>
          On track means the sum of annual reductions across all registered
          climate actions meets or exceeds the linear pacing target for the
          current year, computed between the city&rsquo;s journey-start and its
          target year.
        </p>
        <p>
          As of {currentYear}, with the target year set to {targetYear}, the
          pacing target is{" "}
          <span className="stat font-semibold text-ink">{expectedPercent}%</span>{" "}
          of the baseline. All actions count toward the total regardless of
          status — this dashboard is intentionally optimistic about commitments.
        </p>
      </div>
    </details>
  );
}
