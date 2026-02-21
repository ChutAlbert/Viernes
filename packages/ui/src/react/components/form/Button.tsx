import React from "react";
import { cn } from "../../utils/cn";

type ButtonType = "button" | "submit" | "reset";

export function Button({
  text,
  loadingText = "Cargando...",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  className,
}: {
  text: string;
  loadingText?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: ButtonType;
  onClick?: () => void;
  className?: string;
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-full rounded-lg bg-slate-900 text-white py-2 font-medium",
        "hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? loadingText : text}
    </button>
  );
}
