"use client";

import { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 shadow-sm",
  secondary:
    "bg-white text-ink border border-ink-line hover:border-emerald-500 hover:text-emerald-700 disabled:text-ink-mute",
  danger:
    "bg-ember-500 text-white hover:bg-ember-600 disabled:bg-ember-400 shadow-sm",
  ghost:
    "bg-transparent text-ink-soft hover:text-emerald-700 hover:bg-emerald-50 disabled:text-ink-mute",
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
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed ${sizing} ${BUTTON_STYLES[variant]}`}
    >
      {children}
    </button>
  );
}
