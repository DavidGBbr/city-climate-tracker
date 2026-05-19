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
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <caption className="sr-only">
          Climate actions registered for the city
        </caption>
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2">
              Title
            </th>
            <th scope="col" className="px-4 py-2">
              Sector
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              Reduction (t/yr)
            </th>
            <th scope="col" className="px-4 py-2">
              Status
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              Start year
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              <span className="sr-only">Row actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                Loading actions…
              </td>
            </tr>
          )}
          {hasError && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-red-600">
                Failed to load actions.
              </td>
            </tr>
          )}
          {!isLoading && !hasError && actions?.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                No actions yet. Add the first one above.
              </td>
            </tr>
          )}
          {actions?.map((action) => (
            <tr
              key={action.id}
              className={
                editingId === action.id
                  ? "border-t border-slate-200 bg-emerald-50"
                  : "border-t border-slate-200"
              }
            >
              <td className="px-4 py-2 font-medium">{action.title}</td>
              <td className="px-4 py-2">{SECTOR_LABELS[action.sector]}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {action.annual_reduction.toLocaleString()}
              </td>
              <td className="px-4 py-2">{STATUS_LABELS[action.status]}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {action.start_year}
              </td>
              <td className="px-4 py-2 text-right">
                <div className="inline-flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(action)}
                    ariaLabel={`Edit ${action.title}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
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
  );
}
