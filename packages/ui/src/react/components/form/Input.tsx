import React, { useState } from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

type InputType = "text" | "email" | "password" | "number" | "date";
type InputVariant = "light" | "dark";

const variantStyles: Record<InputVariant, string> = {
  light: "border-slate-300 bg-white text-slate-800 focus:ring-slate-900/20 placeholder:text-slate-400",
  dark:  "border-[var(--c-border)] bg-[var(--c-input-bg)] text-[var(--c-text)] placeholder:text-[var(--c-text-4)]",
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  disabled = false,
  variant = "light",
  showPasswordToggle = false,
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
  showPasswordToggle?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
}) {
  const inputId = id ?? name;
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = type === "password" && showPasswordToggle && showPassword ? "text" : type;

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label name={label} />}

      <div className="relative">
        <input
          id={inputId}
          name={name}
          className={cn(
            "w-full rounded-lg border px-3 py-2.5 text-sm",
            "focus:outline-none focus:ring-2",
            variantStyles[variant],
            type === "password" && showPasswordToggle && "pr-10",
            disabled && "opacity-60 cursor-not-allowed",
            inputClassName
          )}
          placeholder={placeholder}
          type={resolvedType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
        />
        {type === "password" && showPasswordToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: variant === "dark" ? "var(--c-text-3)" : "#64748b" }}
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>
    </div>
  );
}
