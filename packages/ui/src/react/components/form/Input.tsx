import React from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

type InputType = "text" | "email" | "password" | "number" | "date";

export function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  disabled = false,
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
  className?: string;       // clases del contenedor
  inputClassName?: string;  // clases directas del <input>
  id?: string;
  name?: string;
}) {
  const inputId = id ?? name;

  return (
    <div className={cn("space-y-1", className)}>
      {label ? <Label name={label} /> : null}

      <input
        id={inputId}
        name={name}
        className={cn(
          "w-full rounded-lg border border-slate-300 px-3 py-2",
          "focus:outline-none focus:ring-2 focus:ring-slate-900/20",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50",
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
