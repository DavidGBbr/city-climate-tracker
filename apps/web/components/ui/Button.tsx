"use client";

import { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-bg hover:bg-forest-700 disabled:bg-ink-mute disabled:text-bg",
  secondary:
    "bg-transparent text-ink border border-ink-line hover:border-ink hover:bg-bg-elev disabled:text-ink-mute",
  danger:
    "bg-ember-500 text-bg hover:bg-ember-600 disabled:bg-ember-400 disabled:text-bg",
  ghost:
    "bg-transparent text-ink-soft hover:text-ink hover:bg-bg-sunk disabled:text-ink-mute",
};

export type ButtonProps = {
  variant?: ButtonVariant;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  size?: "sm" | "md";
  ariaLabel?: string;
};

export function Button({
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  children,
  size = "md",
  ariaLabel,
}: ButtonProps) {
  const sizing =
    size === "sm"
      ? "px-3 py-1.5 text-[11px] tracking-eyebrow uppercase font-medium"
      : "px-5 py-2.5 text-[12px] tracking-eyebrow uppercase font-medium";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`group inline-flex items-center justify-center gap-2 rounded-sharp transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-ink focus-visible:ring-offset-bg disabled:cursor-not-allowed ${sizing} ${BUTTON_STYLES[variant]}`}
    >
      {children}
    </button>
  );
}
