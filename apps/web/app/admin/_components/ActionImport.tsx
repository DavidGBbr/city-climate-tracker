"use client";

import { FormEvent, useState } from "react";

import {
  Button,
  ErrorMessage,
  SuccessMessage,
  TextArea,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import {
  ActionDraft,
  ActionDraftSchema,
  SECTOR_LABELS,
  STATUS_LABELS,
} from "@/lib/schemas";

type ActionImportProps = {
  onUseDraft: (draft: ActionDraft) => void;
};

const PLACEHOLDER =
  "The city council approved a $2M investment to convert all street lighting " +
  "to LED by 2027. The energy department estimates this will cut approximately " +
  "9,500 tons of CO2 per year once fully deployed. The project is currently in " +
  "the planning phase.";

export function ActionImport({ onUseDraft }: ActionImportProps) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ActionDraft | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lifted, setLifted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDraft(null);
    setLifted(false);

    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError("Paste at least 20 characters of policy text.");
      return;
    }

    try {
      setExtracting(true);
      const raw = await api.post<unknown>("/actions/extract", { text: trimmed });
      const parsed = ActionDraftSchema.safeParse(raw);
      if (!parsed.success) {
        setError(
          "The LLM returned a draft that does not match the schema. Try again."
        );
        return;
      }
      setDraft(parsed.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError("Server validation rejected the input. Paste more detail.");
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Extraction failed. Check that the API is reachable.");
      }
    } finally {
      setExtracting(false);
    }
  }

  function handleUseDraft() {
    if (!draft) return;
    onUseDraft(draft);
    setLifted(true);
  }

  function handleDiscard() {
    setDraft(null);
    setLifted(false);
  }

  return (
    <section
      aria-labelledby="ai-import-heading"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <header className="space-y-1">
        <h2 id="ai-import-heading" className="text-lg font-semibold">
          AI import
        </h2>
        <p className="text-sm text-slate-500">
          Paste a paragraph from a policy document or meeting notes. The LLM
          extracts a structured action you can review before saving.
        </p>
      </header>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextArea
          id="ai-import-text"
          label="Policy or meeting note"
          value={text}
          onChange={setText}
          placeholder={PLACEHOLDER}
          rows={6}
          hint="Minimum 20 characters. The LLM call is idempotent per text."
          required
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={extracting}>
            {extracting ? "Extracting…" : "Extract with AI"}
          </Button>
          {draft && !lifted && (
            <Button type="button" variant="ghost" onClick={handleDiscard}>
              Discard draft
            </Button>
          )}
        </div>
      </form>

      {draft && (
        <div
          aria-labelledby="ai-draft-heading"
          className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 p-4"
        >
          <h3
            id="ai-draft-heading"
            className="text-sm font-semibold text-emerald-900"
          >
            Extracted draft — review before saving
          </h3>
          <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <DraftRow label="Title" value={draft.title} />
            <DraftRow label="Sector" value={SECTOR_LABELS[draft.sector]} />
            <DraftRow
              label="Annual reduction"
              value={`${draft.annual_reduction.toLocaleString()} t CO₂/year`}
            />
            <DraftRow label="Status" value={STATUS_LABELS[draft.status]} />
            <DraftRow label="Start year" value={String(draft.start_year)} />
          </dl>
          <div className="flex items-center gap-3">
            <Button onClick={handleUseDraft} disabled={lifted}>
              {lifted ? "Loaded into form" : "Use as new action"}
            </Button>
            <Button variant="secondary" onClick={handleDiscard}>
              Discard
            </Button>
          </div>
          {lifted && (
            <SuccessMessage>
              Draft loaded into the action form below — edit and save it there.
            </SuccessMessage>
          )}
        </div>
      )}
    </section>
  );
}

function DraftRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-emerald-700">
        {label}
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
