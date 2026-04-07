import React from "react";
import { cn } from "../../utils/cn";

type ButtonType = "button" | "submit" | "reset";

export function Button({
  text,
  children,
  loadingText = "Cargando...",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className,
  variant = "default",
}: {
  text?: string;
  children?: React.ReactNode;
  loadingText?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: ButtonType;
  onClick?: () => void;
  className?: string;
  variant?: "ghost" | "default" | "danger";
}) {
  const isDisabled = disabled || loading;
  const label = text ?? children;

  const baseStyle: React.CSSProperties =
    variant === "ghost"
      ? { background: "transparent", color: "var(--c-text-2)" }
      : variant === "danger"
      ? { background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }
      : { background: "var(--c-accent)", color: "#fff" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150",
        variant === "ghost" && "hover:bg-[var(--c-hover)] hover:text-[var(--c-text)]",
        variant === "default" && "hover:opacity-85",
        variant === "danger" && "hover:bg-red-500/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      style={baseStyle}
    >
      {loading ? loadingText : label}
    </button>
  );
}
