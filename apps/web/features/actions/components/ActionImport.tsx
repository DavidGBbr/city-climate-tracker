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
          "The LLM returned a draft that does not match the schema. Try again.",
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
      className="grid gap-10 md:grid-cols-[14rem_1fr] border-t border-ink-line/70 pt-10"
    >
      <header className="space-y-2">
        <p className="eyebrow text-forest-600">§ 02 · AI</p>
        <h2
          id="ai-import-heading"
          className="font-display text-2xl font-semibold text-ink tracking-tight"
        >
          Read from policy text
        </h2>
        <p className="text-sm text-ink-soft leading-relaxed">
          Paste a paragraph; the LLM extracts a structured action draft you can
          review before saving. Calls are idempotent per text.
        </p>
      </header>

      <div className="space-y-5">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <TextArea
            id="ai-import-text"
            label="Policy or meeting note"
            value={text}
            onChange={setText}
            placeholder={PLACEHOLDER}
            rows={6}
            hint="Minimum 20 characters."
            required
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={extracting}>
              {extracting ? "Extracting…" : "Extract with AI →"}
            </Button>
            {draft && !lifted && (
              <Button type="button" variant="ghost" onClick={handleDiscard}>
                Discard
              </Button>
            )}
          </div>
        </form>

        {draft && (
          <div
            aria-labelledby="ai-draft-heading"
            className="border border-forest-300 bg-forest-50/60 p-6 rounded-sharp"
          >
            <div className="flex items-baseline justify-between mb-4">
              <h3
                id="ai-draft-heading"
                className="eyebrow text-forest-700"
              >
                Extracted draft — review before saving
              </h3>
              <span className="font-mono text-[10px] text-forest-700/70">
                fingerprint matches
              </span>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <DraftRow label="Title" value={draft.title} />
              <DraftRow label="Sector" value={SECTOR_LABELS[draft.sector]} />
              <DraftRow
                label="Annual reduction"
                value={`${draft.annual_reduction.toLocaleString()} t CO₂/yr`}
                mono
              />
              <DraftRow label="Status" value={STATUS_LABELS[draft.status]} />
              <DraftRow
                label="Start year"
                value={String(draft.start_year)}
                mono
              />
            </dl>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={handleUseDraft} disabled={lifted}>
                {lifted ? "Loaded into form" : "Use as new action →"}
              </Button>
              <Button variant="ghost" onClick={handleDiscard}>
                Discard
              </Button>
            </div>
            {lifted && (
              <div className="mt-4">
                <SuccessMessage>
                  Draft loaded into the action form below — edit and save it
                  there.
                </SuccessMessage>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function DraftRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="eyebrow text-forest-700/80">{label}</dt>
      <dd
        className={`text-ink ${mono ? "stat font-medium" : "font-display font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
