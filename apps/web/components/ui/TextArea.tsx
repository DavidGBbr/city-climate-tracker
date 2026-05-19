"use client";

export type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

export function TextArea({
  id,
  label,
  value,
  onChange,
  error,
  rows = 5,
  required,
  placeholder,
  hint,
}: TextAreaProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="eyebrow text-ink-soft flex items-center gap-1"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-forest-600">
            *
          </span>
        )}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full bg-bg-elev border border-ink-line/70 px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none rounded-sharp transition-colors ${
          error ? "border-ember-500" : ""
        }`}
      />
      {hint && (
        <p id={hintId} className="text-[11px] text-ink-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] text-ember-600">
          {error}
        </p>
      )}
    </div>
  );
}
