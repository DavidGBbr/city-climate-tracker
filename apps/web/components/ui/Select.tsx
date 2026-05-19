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
        className="flex items-center gap-1 text-xs font-semibold text-ink-soft"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-emerald-600">
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
          className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm text-ink focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all ${
            error ? "border-ember-500" : "border-ink-line"
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
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {error && (
        <p id={errorId} className="text-[11px] font-medium text-ember-600">
          {error}
        </p>
      )}
    </div>
  );
}
