"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog, ErrorMessage, Modal } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { revalidateCity } from "@/lib/cache";
import { Action, ActionDraft, City } from "@/lib/schemas";

import { useActions } from "../hooks";
import { ActionForm } from "./ActionForm";
import { ActionsTable } from "./ActionsTable";

export type ActionsManagerProps = {
  city: City;
  initialDraft?: ActionDraft | null;
  onDraftConsumed?: () => void;
};

type ModalState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "create-from-draft"; draft: ActionDraft }
  | { kind: "edit"; action: Action }
  | { kind: "delete"; action: Action };

export function ActionsManager({
  city,
  initialDraft = null,
  onDraftConsumed,
}: ActionsManagerProps) {
  const { data: actions, isLoading, error } = useActions(city.id);
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // When an AI draft arrives, automatically open the Create modal prefilled.
  useEffect(() => {
    if (initialDraft) {
      setModal({ kind: "create-from-draft", draft: initialDraft });
    }
  }, [initialDraft]);

  if (city.deleted_at) {
    return (
      <section className="rounded-2xl border border-amber-300 bg-amber-50 px-7 py-5 text-sm text-amber-900">
        This city is archived. Restore it to make changes.
      </section>
    );
  }

  function closeModal() {
    if (
      modal.kind === "create-from-draft" ||
      (initialDraft && modal.kind === "create")
    ) {
      onDraftConsumed?.();
    }
    setModal({ kind: "closed" });
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (modal.kind !== "delete") return;
    const action = modal.action;
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.delete(`/actions/${action.id}`);
      await revalidateCity(city.id);
      setModal({ kind: "closed" });
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Failed to delete action.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const formOpen =
    modal.kind === "create" ||
    modal.kind === "create-from-draft" ||
    modal.kind === "edit";

  const formAction = modal.kind === "edit" ? modal.action : null;
  const formDraft =
    modal.kind === "create-from-draft" ? modal.draft : null;

  const formTitle =
    modal.kind === "edit"
      ? `Edit: ${modal.action.title}`
      : modal.kind === "create-from-draft"
        ? "Review AI draft"
        : "Add a new action";

  const formDescription =
    modal.kind === "edit"
      ? "Update the action's details. Changes apply immediately on save."
      : modal.kind === "create-from-draft"
        ? "The LLM extracted the fields below — review them before saving."
        : "Each action contributes its annual reduction toward the baseline.";

  return (
    <section
      aria-labelledby="actions-heading"
      className="rounded-2xl border border-ink-line/50 bg-bg-elev shadow-soft"
    >
      <header className="flex flex-wrap items-start gap-4 border-b border-ink-line/40 px-7 py-5">
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
        <div className="flex-1 min-w-0">
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
        <div className="flex items-center gap-3">
          {actions && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {actions.length} {actions.length === 1 ? "entry" : "entries"}
            </span>
          )}
          <button
            type="button"
            onClick={() => setModal({ kind: "create" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Add action
          </button>
        </div>
      </header>

      <div className="px-7 py-6">
        <ActionsTable
          actions={actions}
          isLoading={isLoading}
          hasError={Boolean(error)}
          editingId={null}
          deletingId={null}
          onEdit={(action) => setModal({ kind: "edit", action })}
          onDelete={(action) => setModal({ kind: "delete", action })}
        />
      </div>

      <Modal
        open={formOpen}
        onClose={closeModal}
        title={formTitle}
        description={formDescription}
        size="lg"
      >
        <ActionForm
          cityId={city.id}
          action={formAction}
          initialDraft={formDraft}
          onSaved={closeModal}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={modal.kind === "delete"}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title="Delete this action?"
        description={
          modal.kind === "delete"
            ? `"${modal.action.title}" will be removed from the ledger and its reduction will no longer count toward the target. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete action"
        destructive
        busy={deleting}
      />

      {deleteError && (
        <div className="px-7 pb-6">
          <ErrorMessage>{deleteError}</ErrorMessage>
        </div>
      )}
    </section>
  );
}
