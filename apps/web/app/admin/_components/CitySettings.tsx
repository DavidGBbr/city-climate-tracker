"use client";

import { FormEvent, useEffect, useState } from "react";

import { ApiError, api } from "@/lib/api";
import { revalidateCity, useDefaultCity } from "@/lib/hooks";
import { City, CityUpdateSchema } from "@/lib/schemas";

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
    return (
      <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        Could not load city configuration.
      </p>
    );
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

  // Re-sync local form state when the upstream city revalidates.
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

      {formError && (
        <p
          role="alert"
          className="rounded bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      {statusMessage && (
        <p
          role="status"
          aria-live="polite"
          className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
        >
          {statusMessage}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <span className="text-xs text-slate-500">city id: {city.id}</span>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  type?: "text" | "number";
  inputMode?: "text" | "numeric" | "decimal";
  min?: number;
  max?: number;
  step?: string;
  autoComplete?: string;
  required?: boolean;
};

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  inputMode,
  min,
  max,
  step,
  autoComplete,
  required,
}: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      {error && (
        <p id={errorId} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
