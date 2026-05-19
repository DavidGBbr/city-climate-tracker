import { AdminWorkspace } from "./_components/AdminWorkspace";

export default function AdminHome() {
  return (
    <section aria-labelledby="admin-heading" className="space-y-10">
      <header className="reveal relative overflow-hidden rounded-2xl border border-ink-line/50 bg-bg-elev bg-radial-leaf topo-bg px-8 py-10 shadow-soft md:px-12 md:py-12">
        <span
          aria-hidden
          className="blob -right-12 -top-16 h-56 w-56 bg-emerald-200 animate-float"
        />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Restricted · climate team
          </span>
          <h1
            id="admin-heading"
            className="text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight text-ink"
          >
            Admin workspace
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-ink-soft">
            Adjust the baseline, the target year, and the ledger of actions
            that define the city&rsquo;s trajectory. AI-assisted extraction
            turns policy text into a draft action you can review before saving.
          </p>
        </div>
      </header>

      <AdminWorkspace />
    </section>
  );
}
