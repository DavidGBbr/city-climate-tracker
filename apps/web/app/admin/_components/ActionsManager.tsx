"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  Button,
  ErrorMessage,
  Field,
  Select,
  SuccessMessage,
} from "@/components/forms";
import { ApiError, api } from "@/lib/api";
import { revalidateCity, useActions, useDefaultCity } from "@/lib/hooks";
import {
  Action,
  ActionBaseSchema,
  SECTOR_LABELS,
  SECTORS,
  STATUS_LABELS,
  STATUSES,
  Sector,
  Status,
} from "@/lib/schemas";

type FormState = {
  title: string;
  sector: Sector;
  annual_reduction: string;
  status: Status;
  start_year: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  sector: "transport",
  annual_reduction: "",
  status: "planned",
  start_year: String(new Date().getFullYear()),
};

const SECTOR_OPTIONS = SECTORS.map((value) => ({
  value,
  label: SECTOR_LABELS[value],
}));

const STATUS_OPTIONS = STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export function ActionsManager() {
  const { city, isLoading: cityLoading, error: cityError } = useDefaultCity();
  const { data: actions, isLoading, error } = useActions(city?.id);
  const [editing, setEditing] = useState<Action | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        err instanceof ApiError ? err.message : "Failed to delete action."
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

      <ActionForm
        cityId={city.id}
        action={editing}
        onSaved={() => setEditing(null)}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      {deleteError && <ErrorMessage>{deleteError}</ErrorMessage>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Climate actions registered for the city
          </caption>
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2">Title</th>
              <th scope="col" className="px-4 py-2">Sector</th>
              <th scope="col" className="px-4 py-2 text-right">
                Reduction (t/yr)
              </th>
              <th scope="col" className="px-4 py-2">Status</th>
              <th scope="col" className="px-4 py-2 text-right">Start year</th>
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
            {error && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-red-600">
                  Failed to load actions.
                </td>
              </tr>
            )}
            {!isLoading && !error && actions?.length === 0 && (
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
                  editing?.id === action.id
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
                      onClick={() => setEditing(action)}
                      ariaLabel={`Edit ${action.title}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleting === action.id}
                      onClick={() => handleDelete(action)}
                      ariaLabel={`Delete ${action.title}`}
                    >
                      {deleting === action.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type ActionFormProps = {
  cityId: string;
  action: Action | null;
  onSaved: () => void;
  onCancel?: () => void;
};

function ActionForm({ cityId, action, onSaved, onCancel }: ActionFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFieldErrors({});
    setFormError(null);
    setSuccess(null);
    if (action) {
      setForm({
        title: action.title,
        sector: action.sector,
        annual_reduction: String(action.annual_reduction),
        status: action.status,
        start_year: String(action.start_year),
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [action]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSuccess(null);

    const payload = {
      title: form.title.trim(),
      sector: form.sector,
      annual_reduction: Number(form.annual_reduction),
      status: form.status,
      start_year: Number(form.start_year),
    };

    const parsed = ActionBaseSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "form";
        next[field] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    try {
      setSaving(true);
      if (action) {
        await api.patch(`/actions/${action.id}`, parsed.data);
      } else {
        await api.post(`/cities/${cityId}/actions`, parsed.data);
      }
      await revalidateCity(cityId);
      setSuccess(action ? "Action updated." : "Action created.");
      onSaved();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to save action."
      );
    } finally {
      setSaving(false);
    }
  }

  const isEditing = action !== null;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="action-form-heading"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div className="space-y-1">
        <h3 id="action-form-heading" className="text-base font-semibold">
          {isEditing ? `Edit: ${action!.title}` : "Add a new action"}
        </h3>
        <p className="text-sm text-slate-500">
          Each action contributes its annual reduction toward the baseline.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            id="action-title"
            label="Title"
            value={form.title}
            onChange={(v) => update("title", v)}
            error={fieldErrors.title}
            placeholder="Expand bike lane network"
            required
          />
        </div>

        <Select
          id="action-sector"
          label="Sector"
          value={form.sector}
          onChange={(v) => update("sector", v as Sector)}
          options={SECTOR_OPTIONS}
          error={fieldErrors.sector}
          required
        />

        <Select
          id="action-status"
          label="Status"
          value={form.status}
          onChange={(v) => update("status", v as Status)}
          options={STATUS_OPTIONS}
          error={fieldErrors.status}
          required
        />

        <Field
          id="action-reduction"
          label="Annual reduction (tons CO₂ / year)"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={form.annual_reduction}
          onChange={(v) => update("annual_reduction", v)}
          error={fieldErrors.annual_reduction}
          required
        />

        <Field
          id="action-start"
          label="Start year"
          type="number"
          inputMode="numeric"
          min={1900}
          max={2100}
          value={form.start_year}
          onChange={(v) => update("start_year", v)}
          error={fieldErrors.start_year}
          required
        />
      </div>

      {formError && <ErrorMessage>{formError}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : isEditing
              ? "Save changes"
              : "Add action"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFieldErrors({});
              setFormError(null);
              onCancel();
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
