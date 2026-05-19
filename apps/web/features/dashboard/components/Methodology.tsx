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
    <details className="group border-t border-ink-line/70 pt-6">
      <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
        <span className="eyebrow text-ink-soft">
          Methodology &nbsp;/&nbsp; How &ldquo;on track&rdquo; is calculated
        </span>
        <span
          aria-hidden="true"
          className="text-forest-600 text-xs font-mono transition-transform duration-300 group-open:rotate-90"
        >
          ▶
        </span>
      </summary>
      <div className="mt-5 grid gap-5 md:grid-cols-2 text-sm text-ink-soft leading-relaxed">
        <p>
          On track means the sum of annual reductions across all registered
          climate actions meets or exceeds the linear pacing target for the
          current year, computed between the city&rsquo;s journey-start and its
          target year.
        </p>
        <p>
          As of {currentYear}, with the target year set to {targetYear}, the
          pacing target is{" "}
          <span className="stat font-medium text-ink">{expectedPercent}%</span>{" "}
          of the baseline. All actions count toward the total regardless of
          status — this dashboard is intentionally optimistic about commitments.
        </p>
      </div>
    </details>
  );
}
