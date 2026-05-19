import { ReactNode } from "react";

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 border-l-2 border-ember-500 bg-ember-50/60 px-3 py-2 text-sm text-ember-600"
    >
      <span aria-hidden className="font-mono text-xs mt-[2px]">
        ⚠
      </span>
      <span>{children}</span>
    </p>
  );
}

export function SuccessMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 border-l-2 border-forest-500 bg-forest-50 px-3 py-2 text-sm text-forest-700"
    >
      <span aria-hidden className="font-mono text-xs mt-[2px]">
        ✓
      </span>
      <span>{children}</span>
    </p>
  );
}
