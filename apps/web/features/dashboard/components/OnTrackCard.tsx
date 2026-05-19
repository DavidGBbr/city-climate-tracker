export function OnTrackCard({ onTrack }: { onTrack: boolean }) {
  const palette = onTrack
    ? {
        gradient: "from-emerald-50 to-emerald-100/60",
        ring: "border-emerald-200",
        dot: "bg-emerald-500",
        title: "text-emerald-900",
        body: "text-emerald-800/80",
        label: "On track",
        icon: (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4 12 5 5L20 6" />
          </svg>
        ),
      }
    : {
        gradient: "from-ember-50 to-ember-50/40",
        ring: "border-ember-400/40",
        dot: "bg-ember-500",
        title: "text-ember-600",
        body: "text-ember-600/80",
        label: "Off pace",
        icon: (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        ),
      };

  return (
    <section
      aria-labelledby="status-heading"
      className={`relative flex flex-col gap-5 overflow-hidden rounded-2xl border bg-gradient-to-br p-7 shadow-soft ${palette.ring} ${palette.gradient}`}
    >
      <div className="flex items-center justify-between">
        <h2
          id="status-heading"
          className="text-sm font-semibold text-ink-soft"
        >
          Verdict
        </h2>
        <span
          aria-hidden="true"
          className="relative inline-flex h-2.5 w-2.5"
        >
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-soft-pulse ${palette.dot}`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${palette.dot}`}
          />
        </span>
      </div>

      <div className={`flex items-center gap-3 ${palette.title}`}>
        {palette.icon}
        <p
          role="status"
          aria-live="polite"
          className="text-3xl font-extrabold leading-none tracking-tight"
        >
          {palette.label}
        </p>
      </div>

      <p className={`text-sm leading-relaxed ${palette.body}`}>
        {onTrack
          ? "Current commitments meet or exceed the linear pacing target for this year."
          : "Current commitments fall short of the linear pacing target for this year."}
      </p>
    </section>
  );
}
