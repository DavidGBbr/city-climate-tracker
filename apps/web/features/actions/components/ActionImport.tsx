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
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
          </svg>
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-eyebrow text-emerald-700">
            Step 02 · AI assist
          </p>
          <h2
            id="ai-import-heading"
            className="mt-0.5 text-lg font-bold tracking-tight text-ink"
          >
            Read from policy text
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Paste a paragraph; the LLM extracts a structured action draft you
            can review before saving. Calls are idempotent per text.
          </p>
        </div>
      </header>

      <div className="px-7 py-6 space-y-5">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
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
              {extracting ? "Extracting…" : "Extract with AI"}
              {!extracting && <Sparkles />}
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
            className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                id="ai-draft-heading"
                className="text-sm font-bold text-emerald-900"
              >
                Extracted draft — review before saving
              </h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-mono text-[10px] text-emerald-700">
                cached
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
                {lifted ? "Loaded into form" : "Use as new action"}
                {!lifted && <Arrow />}
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
      <dt className="text-[10px] font-semibold uppercase tracking-eyebrow text-emerald-700/80">
        {label}
      </dt>
      <dd
        className={`font-semibold text-ink ${mono ? "stat" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Sparkles() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
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
