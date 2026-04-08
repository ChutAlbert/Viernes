import React from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

type InputType = "text" | "email" | "password" | "number" | "date";
type InputVariant = "light" | "dark";

const variantStyles: Record<InputVariant, string> = {
  light: "border-slate-300 bg-white text-slate-800 focus:ring-slate-900/20 placeholder:text-slate-400",
  dark:  "border-[var(--c-border)] bg-[var(--c-input-bg)] text-[var(--c-text)] placeholder:text-[var(--c-text-4)]",
};

export function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  disabled = false,
  variant = "light",
  className,
  inputClassName,
  id,
  name,
}: {
  label?: string;
  placeholder?: string;
  type?: InputType;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  variant?: InputVariant;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
}) {
  const inputId = id ?? name;

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label name={label} />}

      <input
        id={inputId}
        name={name}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2",
          variantStyles[variant],
          disabled && "opacity-60 cursor-not-allowed",
          inputClassName
        )}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
    </div>
  );
}
