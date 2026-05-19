"use client";

import { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 disabled:text-slate-400",
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
  const sizing = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-md font-medium shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${sizing} ${BUTTON_STYLES[variant]}`}
    >
      {children}
    </button>
  );
}
