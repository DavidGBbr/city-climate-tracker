"use client";

import { SelectHTMLAttributes } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value"
> & {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly SelectOption[];
  error?: string;
  required?: boolean;
};

export function Select({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required,
  ...rest
}: SelectProps) {
  const errorId = error ? `${id}-error` : undefined;
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
      <div className="relative">
        <select
          id={id}
          name={id}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`w-full appearance-none bg-transparent border-b border-ink-line px-0 py-2 pr-6 text-base font-display text-ink focus:border-ink focus:outline-none transition-colors ${
            error ? "border-ember-500" : ""
          }`}
          {...rest}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-ink-mute text-xs font-mono"
        >
          ▾
        </span>
      </div>
      {error && (
        <p id={errorId} className="text-[11px] text-ember-600">
          {error}
        </p>
      )}
    </div>
  );
}
