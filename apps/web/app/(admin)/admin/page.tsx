import { AdminWorkspace } from "./_components/AdminWorkspace";

export default function AdminHome() {
  return (
    <section aria-labelledby="admin-heading" className="space-y-10">
      <header className="reveal space-y-4 pb-2">
        <p className="eyebrow flex items-center gap-3">
          <span className="h-px w-8 bg-forest-500" aria-hidden />
          Restricted · climate team
        </p>
        <h1
          id="admin-heading"
          className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[0.95] tracking-tight text-ink"
        >
          Admin workspace.
        </h1>
        <p className="max-w-xl text-base text-ink-soft leading-relaxed">
          Adjust the baseline, the target year, and the ledger of actions that
          define the city&rsquo;s trajectory. AI-assisted extraction turns policy
          text into a draft action you can review before saving.
        </p>
      </header>

      <div className="rule-leaf" aria-hidden />

      <AdminWorkspace />
    </section>
  );
}
