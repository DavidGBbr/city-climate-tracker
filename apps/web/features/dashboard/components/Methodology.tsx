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
    <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
      <summary className="cursor-pointer font-medium text-slate-700">
        How is &ldquo;On track&rdquo; calculated?
      </summary>
      <div className="mt-2 space-y-2">
        <p>
          On track means the sum of annual reductions across all registered
          climate actions meets or exceeds the linear pacing target for the
          current year.
        </p>
        <p>
          As of {currentYear}, with the target year set to {targetYear}, the
          pacing target is{" "}
          <span className="font-medium text-slate-800">{expectedPercent}%</span>{" "}
          of the baseline.
        </p>
        <p className="text-xs text-slate-500">
          All actions count toward the total regardless of status — the
          dashboard is intentionally optimistic about commitments.
        </p>
      </div>
    </details>
  );
}
