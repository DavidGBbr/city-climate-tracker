export default function AdminHome() {
  return (
    <section aria-labelledby="admin-heading" className="space-y-4">
      <header className="space-y-1">
        <h1 id="admin-heading" className="text-3xl font-bold tracking-tight">
          Admin workspace
        </h1>
        <p className="text-slate-600">
          Climate team controls — baseline, target year, climate actions, and
          AI-assisted import from policy text.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Forms ship in T9 (city settings), T10 (actions CRUD), and T11 (AI import).
      </div>
    </section>
  );
}
