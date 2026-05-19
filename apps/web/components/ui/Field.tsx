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
        className="flex items-center gap-1 text-xs font-semibold text-ink-soft"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-emerald-600">
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
        className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all ${
          type === "number" ? "stat" : ""
        } ${error ? "border-ember-500" : "border-ink-line"}`}
      />
      {hint && (
        <p id={hintId} className="text-[11px] text-ink-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[11px] font-medium text-ember-600">
          {error}
        </p>
      )}
    </div>
  );
}
