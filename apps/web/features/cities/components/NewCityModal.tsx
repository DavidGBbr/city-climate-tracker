"use client";

import { FormEvent, useState } from "react";

import { Button, ErrorMessage, Field, Modal } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { CityCreateSchema, type City } from "@/lib/schemas";

import { createCity } from "../hooks";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (city: City) => void;
};

export function NewCityModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [baseline, setBaseline] = useState("");
  const [target, setTarget] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setBaseline("");
    setTarget("");
    setFieldErrors({});
    setFormError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);
    const payload = {
      name: name.trim(),
      baseline_emissions: Number(baseline),
      target_year: Number(target),
    };
    const parsed = CityCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const f = issue.path[0]?.toString() ?? "form";
        next[f] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    try {
      setSaving(true);
      const created = await createCity(parsed.data);
      onCreated(created);
      reset();
      onClose();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to create city.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New city"
      description="Add a new city. You can edit its baseline and target later."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="new-city-name"
          label="City name"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          autoComplete="off"
          required
        />
        <Field
          id="new-city-baseline"
          label="Baseline emissions (t CO₂ / yr)"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={baseline}
          onChange={setBaseline}
          error={fieldErrors.baseline_emissions}
          required
        />
        <Field
          id="new-city-target"
          label="Target year (net zero)"
          type="number"
          inputMode="numeric"
          min={1900}
          max={2100}
          value={target}
          onChange={setTarget}
          error={fieldErrors.target_year}
          required
        />
        {formError && <ErrorMessage>{formError}</ErrorMessage>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create city"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
