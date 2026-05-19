export function OnTrackCard({ onTrack }: { onTrack: boolean }) {
  const styles = onTrack
    ? {
        wrapper: "border-emerald-200 bg-emerald-50",
        dot: "bg-emerald-500",
        title: "text-emerald-900",
        body: "text-emerald-800",
      }
    : {
        wrapper: "border-red-200 bg-red-50",
        dot: "bg-red-500",
        title: "text-red-900",
        body: "text-red-800",
      };

  return (
    <section
      aria-labelledby="status-heading"
      className={`flex flex-col justify-center space-y-2 rounded-lg border p-6 ${styles.wrapper}`}
    >
      <h2 id="status-heading" className="text-sm font-medium text-slate-500">
        Status
      </h2>
      <p
        role="status"
        aria-live="polite"
        className={`flex items-center gap-2 text-xl font-semibold ${styles.title}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-3 w-3 rounded-full ${styles.dot}`}
        />
        {onTrack ? "On track" : "Off track"}
      </p>
      <p className={`text-sm ${styles.body}`}>
        {onTrack
          ? "Current commitments meet or exceed the linear pacing target for this year."
          : "Current commitments lag behind the linear pacing target for this year."}
      </p>
    </section>
  );
}
