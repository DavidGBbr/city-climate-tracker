"use client";

import { useEffect, useRef, useState } from "react";

import { ErrorMessage } from "@/components/ui";
import { useDefaultCity } from "@/features/cities/hooks";
import { ApiError, api } from "@/lib/api";
import { revalidateCity } from "@/lib/cache";
import { Action, ActionDraft } from "@/lib/schemas";

import { useActions } from "../hooks";
import { ActionForm } from "./ActionForm";
import { ActionsTable } from "./ActionsTable";

export type ActionsManagerProps = {
  initialDraft?: ActionDraft | null;
  onDraftConsumed?: () => void;
};

export function ActionsManager({
  initialDraft = null,
  onDraftConsumed,
}: ActionsManagerProps = {}) {
  const { city, isLoading: cityLoading, error: cityError } = useDefaultCity();
  const { data: actions, isLoading, error } = useActions(city?.id);
  const [editing, setEditing] = useState<Action | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDraft && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialDraft]);

  if (cityLoading) {
    return <p className="text-sm text-ink-mute">Loading…</p>;
  }
  if (cityError || !city) {
    return <ErrorMessage>Could not load city configuration.</ErrorMessage>;
  }

  async function handleDelete(action: Action) {
    if (!city) return;
    const confirmed = window.confirm(`Delete action "${action.title}"?`);
    if (!confirmed) return;

    setDeleteError(null);
    setDeleting(action.id);
    try {
      await api.delete(`/actions/${action.id}`);
      await revalidateCity(city.id);
      if (editing?.id === action.id) setEditing(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Failed to delete action.",
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section
      aria-labelledby="actions-heading"
      className="rounded-2xl border border-ink-line/50 bg-bg-elev shadow-soft"
    >
      <header className="flex items-start gap-4 border-b border-ink-line/40 px-7 py-5">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7h18" />
            <path d="M3 12h18" />
            <path d="M3 17h18" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-emerald-700">
            Step 03
          </p>
          <h2
            id="actions-heading"
            className="mt-0.5 text-lg font-bold tracking-tight text-ink"
          >
            Climate actions
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            The ledger. Add, edit, or remove the actions counted toward the
            reduction target.
          </p>
        </div>
        {actions && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {actions.length} {actions.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </header>

      <div className="px-7 py-6 space-y-6">
        <div ref={formRef}>
          <ActionForm
            cityId={city.id}
            action={editing}
            initialDraft={editing ? null : initialDraft}
            onSaved={() => {
              setEditing(null);
              onDraftConsumed?.();
            }}
            onCancel={
              editing || initialDraft
                ? () => {
                    setEditing(null);
                    onDraftConsumed?.();
                  }
                : undefined
            }
          />
        </div>

        {deleteError && <ErrorMessage>{deleteError}</ErrorMessage>}

        <ActionsTable
          actions={actions}
          isLoading={isLoading}
          hasError={Boolean(error)}
          editingId={editing?.id ?? null}
          deletingId={deleting}
          onEdit={setEditing}
          onDelete={handleDelete}
        />
      </div>
    </section>
  );
}
