import { AdminWorkspace } from "./_components/AdminWorkspace";

export default function AdminHome() {
  return (
    <section aria-labelledby="admin-heading" className="space-y-6">
      <header className="space-y-1">
        <h1 id="admin-heading" className="text-3xl font-bold tracking-tight">
          Admin workspace
        </h1>
        <p className="text-slate-600">
          Climate team controls — baseline, target year, actions, and AI-assisted
          import from policy text.
        </p>
      </header>

      <AdminWorkspace />
    </section>
  );
}
