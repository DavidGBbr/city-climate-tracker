export function OnTrackCard({ onTrack }: { onTrack: boolean }) {
  const palette = onTrack
    ? {
        border: "border-forest-300",
        bg: "bg-forest-50",
        dot: "bg-forest-500",
        title: "text-forest-800",
        body: "text-forest-700",
        label: "On track",
      }
    : {
        border: "border-ember-400/60",
        bg: "bg-ember-50",
        dot: "bg-ember-500",
        title: "text-ember-600",
        body: "text-ember-600/90",
        label: "Off pace",
      };

  return (
    <section
      aria-labelledby="status-heading"
      className={`flex flex-col justify-between gap-6 p-8 rounded-sharp shadow-card border ${palette.border} ${palette.bg}`}
    >
      <div className="flex items-center justify-between">
        <h2 id="status-heading" className="eyebrow text-ink-soft">
          Verdict
        </h2>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-2.5 w-2.5 ${palette.dot}`}
        >
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping ${palette.dot}`}
          />
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${palette.dot}`} />
        </span>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`font-display text-3xl font-semibold leading-none tracking-tight ${palette.title}`}
      >
        {palette.label}.
      </p>

      <p className={`text-sm leading-relaxed ${palette.body}`}>
        {onTrack
          ? "Current commitments meet or exceed the linear pacing target for this year."
          : "Current commitments fall short of the linear pacing target for this year."}
      </p>
    </section>
  );
}
