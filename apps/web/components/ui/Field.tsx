"use client";

export type FieldProps = {
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
  placeholder?: string;
  hint?: string;
};

export function Field({
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
  placeholder,
  hint,
}: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1.5">
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full bg-transparent border-b border-ink-line px-0 py-2 text-base font-display text-ink placeholder:text-ink-mute focus:border-ink focus:outline-none transition-colors ${
          type === "number" ? "stat" : ""
        } ${error ? "border-ember-500" : ""}`}
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
