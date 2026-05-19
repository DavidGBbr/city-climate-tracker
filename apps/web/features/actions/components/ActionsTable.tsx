"use client";

import { Button } from "@/components/ui";
import {
  Action,
  SECTOR_LABELS,
  STATUS_LABELS,
  Status,
} from "@/lib/schemas";

export type ActionsTableProps = {
  actions: Action[] | undefined;
  isLoading: boolean;
  hasError: boolean;
  editingId: string | null;
  deletingId: string | null;
  onEdit: (action: Action) => void;
  onDelete: (action: Action) => void;
};

const STATUS_PILL: Record<Status, string> = {
  planned: "bg-bg-sunk text-ink-soft",
  "in progress": "bg-emerald-100 text-emerald-800",
  completed: "bg-ink text-bg",
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
    <div className="rounded-xl border border-ink-line/50 bg-white overflow-hidden">
      <div className="border-b border-ink-line/40 px-6 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-emerald-700">
          Ledger
        </p>
        <h3 className="mt-0.5 text-base font-bold tracking-tight text-ink">
          Actions on file
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Climate actions registered for the city
          </caption>
          <thead>
            <tr className="border-b border-ink-line/40 bg-bg-sunk/30">
              <th
                scope="col"
                className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-eyebrow text-ink-mute"
              >
                Title
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-eyebrow text-ink-mute"
              >
                Sector
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-eyebrow text-ink-mute"
              >
                t/yr
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-eyebrow text-ink-mute"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-eyebrow text-ink-mute"
              >
                Start
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                <span className="sr-only">Row actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-ink-mute"
                >
                  Loading actions…
                </td>
              </tr>
            )}
            {hasError && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-ember-600"
                >
                  Failed to load actions.
                </td>
              </tr>
            )}
            {!isLoading && !hasError && actions?.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-ink-mute"
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
                    ? "border-b border-ink-line/30 bg-emerald-50/60"
                    : "border-b border-ink-line/30 transition-colors hover:bg-emerald-50/30"
                }
              >
                <td className="px-6 py-3.5 font-semibold text-ink">
                  {action.title}
                </td>
                <td className="px-3 py-3.5 text-ink-soft">
                  {SECTOR_LABELS[action.sector]}
                </td>
                <td className="stat px-3 py-3.5 text-right font-medium text-ink">
                  {action.annual_reduction.toLocaleString()}
                </td>
                <td className="px-3 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_PILL[action.status]}`}
                  >
                    {STATUS_LABELS[action.status]}
                  </span>
                </td>
                <td className="stat px-3 py-3.5 text-right text-ink-soft">
                  {action.start_year}
                </td>
                <td className="px-6 py-3.5 text-right">
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
