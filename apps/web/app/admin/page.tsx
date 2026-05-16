import { ActionsManager } from "./_components/ActionsManager";
import { CitySettings } from "./_components/CitySettings";

export default function AdminHome() {
  return (
    <section aria-labelledby="admin-heading" className="space-y-8">
      <header className="space-y-1">
        <h1 id="admin-heading" className="text-3xl font-bold tracking-tight">
          Admin workspace
        </h1>
        <p className="text-slate-600">
          Climate team controls — baseline, target year, actions, and AI-assisted
          import from policy text.
        </p>
      </header>

      <CitySettings />

      <ActionsManager />

      <div
        aria-labelledby="import-placeholder-heading"
        className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500"
      >
        <h2 id="import-placeholder-heading" className="font-medium text-slate-700">
          AI import
        </h2>
        <p className="mt-1">Paste a paragraph from policy notes — ships in T11.</p>
      </div>
    </section>
  );
}
