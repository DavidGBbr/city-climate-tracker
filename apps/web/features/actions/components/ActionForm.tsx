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

  const eyebrowText = isEditing
    ? "Editing"
    : fromDraft
      ? "From AI draft"
      : "New entry";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="action-form-heading"
      className="rounded-xl border border-ink-line/50 bg-bg/40"
    >
      <div className="flex items-baseline justify-between border-b border-ink-line/40 px-6 pt-5 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-emerald-700">
            {eyebrowText}
          </p>
          <h3
            id="action-form-heading"
            className="mt-0.5 text-base font-bold tracking-tight text-ink"
          >
            {headingText}
          </h3>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        <Field
          id="action-title"
          label="Title"
          value={form.title}
          onChange={(v) => update("title", v)}
          error={fieldErrors.title}
          placeholder="Expand bike lane network"
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
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
            label="Annual reduction (t CO₂ / yr)"
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
      </div>

      <div className="flex items-center gap-3 border-t border-ink-line/40 bg-bg-sunk/30 px-6 py-4 rounded-b-xl">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Saving…"
            : isEditing
              ? "Save changes"
              : fromDraft
                ? "Save draft"
                : "Add action"}
          {!saving && (
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
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
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
