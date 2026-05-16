export default function Home() {
  return (
    <section aria-labelledby="public-heading" className="space-y-4">
      <header className="space-y-1">
        <h1 id="public-heading" className="text-3xl font-bold tracking-tight">
          Public dashboard
        </h1>
        <p className="text-slate-600">
          City progress against the net-zero baseline.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Dashboard widgets ship in T12 — total reductions, sector breakdown,
        on-track indicator.
      </div>
    </section>
  );
}
