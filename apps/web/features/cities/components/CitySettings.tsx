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
    return <p className="text-sm text-ink-mute">Loading city…</p>;
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
    <section
      aria-labelledby="city-settings-heading"
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
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9v.01" />
            <path d="M9 12v.01" />
            <path d="M9 15v.01" />
            <path d="M9 18v.01" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-emerald-700">
            Step 01
          </p>
          <h2
            id="city-settings-heading"
            className="mt-0.5 text-lg font-bold tracking-tight text-ink"
          >
            City profile
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Baseline emissions and the target year drive the on-track
            calculation.
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} noValidate className="px-7 py-6 space-y-5">
        <Field
          id="city-name"
          label="City name"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          autoComplete="off"
          required
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="city-baseline"
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
        </div>

        {formError && <ErrorMessage>{formError}</ErrorMessage>}
        {statusMessage && <SuccessMessage>{statusMessage}</SuccessMessage>}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
            {!saving && <Arrow />}
          </Button>
          <span className="text-[11px] text-ink-mute">
            <code className="font-mono">id={city.id.slice(0, 8)}…</code>
          </span>
        </div>
      </form>
    </section>
  );
}

function Arrow() {
  return (
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
  );
}
