"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  Button,
  ErrorMessage,
  Field,
  Select,
  SuccessMessage,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { revalidateCity } from "@/lib/cache";
import {
  Action,
  ActionBaseSchema,
  ActionDraft,
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

function draftToFormState(draft: ActionDraft): FormState {
  return {
    title: draft.title,
    sector: draft.sector,
    annual_reduction: String(draft.annual_reduction),
    status: draft.status,
    start_year: String(draft.start_year),
  };
}

function actionToFormState(action: Action): FormState {
  return {
    title: action.title,
    sector: action.sector,
    annual_reduction: String(action.annual_reduction),
    status: action.status,
    start_year: String(action.start_year),
  };
}

export type ActionFormProps = {
  cityId: string;
  action: Action | null;
  initialDraft?: ActionDraft | null;
  onSaved: () => void;
  onCancel?: () => void;
};

export function ActionForm({
  cityId,
  action,
  initialDraft = null,
  onSaved,
  onCancel,
}: ActionFormProps) {
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
      setForm(actionToFormState(action));
    } else if (initialDraft) {
      setForm(draftToFormState(initialDraft));
    } else {
      setForm(EMPTY_FORM);
    }
  }, [action, initialDraft]);

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
        err instanceof ApiError ? err.message : "Failed to save action.",
      );
    } finally {
      setSaving(false);
    }
  }

  const isEditing = action !== null;
  const fromDraft = !isEditing && initialDraft !== null;
  const headingText = isEditing
    ? `Edit: ${action!.title}`
    : fromDraft
      ? "Review AI draft"
      : "Add a new action";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="action-form-heading"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div className="space-y-1">
        <h3 id="action-form-heading" className="text-base font-semibold">
          {headingText}
        </h3>
        <p className="text-sm text-slate-500">
          {fromDraft
            ? "AI-extracted fields below — edit anything before saving."
            : "Each action contributes its annual reduction toward the baseline."}
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
              : fromDraft
                ? "Save draft as action"
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
