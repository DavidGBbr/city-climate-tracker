import { ReactNode } from "react";

export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {children}
    </p>
  );
}

export function SuccessMessage({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
    >
      {children}
    </p>
  );
}
