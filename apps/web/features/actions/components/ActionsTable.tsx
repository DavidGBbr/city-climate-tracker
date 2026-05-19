"use client";

import { Button } from "@/components/ui";
import { Action, SECTOR_LABELS, STATUS_LABELS } from "@/lib/schemas";

export type ActionsTableProps = {
  actions: Action[] | undefined;
  isLoading: boolean;
  hasError: boolean;
  editingId: string | null;
  deletingId: string | null;
  onEdit: (action: Action) => void;
  onDelete: (action: Action) => void;
};

const STATUS_STYLES: Record<string, string> = {
  planned: "text-ink-mute",
  "in progress": "text-forest-600",
  completed: "text-ink",
};

export function ActionsTable({
  actions,
  isLoading,
  hasError,
  editingId,
  deletingId,
  onEdit,
  onDelete,
}: ActionsTableProps) {
  return (
    <div className="bg-bg-elev border border-ink-line/70 rounded-sharp shadow-card overflow-hidden">
      <div className="px-7 pt-6 pb-3 border-b border-ink-line/70">
        <p className="eyebrow">Ledger</p>
        <h3 className="font-display text-xl font-semibold text-ink tracking-tight mt-1">
          Actions on file
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Climate actions registered for the city
          </caption>
          <thead>
            <tr className="border-b border-ink-line/60">
              <th
                scope="col"
                className="eyebrow text-left px-7 py-3 text-ink-mute font-medium"
              >
                Title
              </th>
              <th
                scope="col"
                className="eyebrow text-left px-4 py-3 text-ink-mute font-medium"
              >
                Sector
              </th>
              <th
                scope="col"
                className="eyebrow text-right px-4 py-3 text-ink-mute font-medium"
              >
                t/yr
              </th>
              <th
                scope="col"
                className="eyebrow text-left px-4 py-3 text-ink-mute font-medium"
              >
                Status
              </th>
              <th
                scope="col"
                className="eyebrow text-right px-4 py-3 text-ink-mute font-medium"
              >
                Start
              </th>
              <th scope="col" className="px-7 py-3 text-right">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-7 py-10 text-center eyebrow text-ink-mute"
                >
                  Loading actions…
                </td>
              </tr>
            )}
            {hasError && (
              <tr>
                <td
                  colSpan={6}
                  className="px-7 py-10 text-center eyebrow text-ember-600"
                >
                  Failed to load actions.
                </td>
              </tr>
            )}
            {!isLoading && !hasError && actions?.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-7 py-10 text-center eyebrow text-ink-mute"
                >
                  No actions yet. Add the first one above.
                </td>
              </tr>
            )}
            {actions?.map((action) => (
              <tr
                key={action.id}
                className={
                  editingId === action.id
                    ? "border-b border-ink-line/40 bg-forest-50/60"
                    : "border-b border-ink-line/40 hover:bg-bg-sunk/40 transition-colors"
                }
              >
                <td className="px-7 py-4 font-display font-medium text-ink">
                  {action.title}
                </td>
                <td className="px-4 py-4 text-ink-soft">
                  {SECTOR_LABELS[action.sector]}
                </td>
                <td className="px-4 py-4 text-right stat text-ink">
                  {action.annual_reduction.toLocaleString()}
                </td>
                <td
                  className={`px-4 py-4 eyebrow ${STATUS_STYLES[action.status]}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${
                        action.status === "completed"
                          ? "bg-ink"
                          : action.status === "in progress"
                            ? "bg-forest-500"
                            : "bg-ink-line"
                      }`}
                    />
                    {STATUS_LABELS[action.status]}
                  </span>
                </td>
                <td className="px-4 py-4 text-right stat text-ink-soft">
                  {action.start_year}
                </td>
                <td className="px-7 py-4 text-right">
                  <div className="inline-flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(action)}
                      ariaLabel={`Edit ${action.title}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === action.id}
                      onClick={() => onDelete(action)}
                      ariaLabel={`Delete ${action.title}`}
                    >
                      {deletingId === action.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
