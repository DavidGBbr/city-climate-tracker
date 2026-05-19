"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  Button,
  ErrorMessage,
  Field,
  SuccessMessage,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { revalidateCity } from "@/lib/cache";
import { City, CityUpdateSchema } from "@/lib/schemas";

import { useDefaultCity } from "../hooks";

export function CitySettings() {
  const { city, isLoading, error } = useDefaultCity();

  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-slate-500">
        Loading city…
      </p>
    );
  }

  if (error || !city) {
    return <ErrorMessage>Could not load city configuration.</ErrorMessage>;
  }

  return <CitySettingsForm city={city} />;
}

function CitySettingsForm({ city }: { city: City }) {
  const [name, setName] = useState(city.name);
  const [baseline, setBaseline] = useState(String(city.baseline_emissions));
  const [target, setTarget] = useState(String(city.target_year));
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(city.name);
    setBaseline(String(city.baseline_emissions));
    setTarget(String(city.target_year));
  }, [city.id, city.name, city.baseline_emissions, city.target_year]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setStatusMessage(null);

    const payload = {
      name: name.trim(),
      baseline_emissions: Number(baseline),
      target_year: Number(target),
    };

    const parsed = CityUpdateSchema.safeParse(payload);
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
      await api.patch<City>(`/cities/${city.id}`, parsed.data);
      await revalidateCity(city.id);
      setStatusMessage("City settings saved.");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to save city settings.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="city-settings-heading"
      className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <div className="space-y-1">
        <h2 id="city-settings-heading" className="text-lg font-semibold">
          City settings
        </h2>
        <p className="text-sm text-slate-500">
          Baseline emissions and the target year drive the on-track calculation.
        </p>
      </div>

      <Field
        id="city-name"
        label="City name"
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        autoComplete="off"
        required
      />

      <Field
        id="city-baseline"
        label="Baseline emissions (tons CO₂ / year)"
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
        id="city-target"
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
      {statusMessage && <SuccessMessage>{statusMessage}</SuccessMessage>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <span className="text-xs text-slate-500">city id: {city.id}</span>
      </div>
    </form>
  );
}
