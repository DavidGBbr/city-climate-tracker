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

  // Scroll the form into view when a draft arrives from AI import.
  useEffect(() => {
    if (initialDraft && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialDraft]);

  if (cityLoading) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-slate-500">
        Loading…
      </p>
    );
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
    <section aria-labelledby="actions-heading" className="space-y-4">
      <header className="space-y-1">
        <h2 id="actions-heading" className="text-lg font-semibold">
          Climate actions
        </h2>
        <p className="text-sm text-slate-500">
          Add, edit, or remove the actions counted toward the reduction target.
        </p>
      </header>

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
    </section>
  );
}
