import React from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

type TextareaVariant = "light" | "dark";

const variantStyles: Record<TextareaVariant, string> = {
  light: "border-slate-300 bg-white text-slate-800 focus:ring-slate-900/20 placeholder:text-slate-400",
  dark:  "border-[var(--c-border)] bg-[var(--c-input-bg)] text-[var(--c-text)] placeholder:text-[var(--c-text-4)]",
};

export function Textarea({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  rows = 4,
  resize = "none",
  variant = "light",
  className,
  textareaClassName,
  id,
  name,
}: {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  resize?: "none" | "y" | "x" | "both";
  variant?: TextareaVariant;
  className?: string;
  textareaClassName?: string;
  id?: string;
  name?: string;
}) {
  const inputId = id ?? name;
  const resizeClass = { none: "resize-none", y: "resize-y", x: "resize-x", both: "resize" };

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label name={label} />}

      <textarea
        id={inputId}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2",
          resizeClass[resize],
          variantStyles[variant],
          disabled && "opacity-60 cursor-not-allowed",
          textareaClassName
        )}
      />
    </div>
  );
}
