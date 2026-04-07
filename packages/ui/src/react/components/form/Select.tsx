import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

export type SelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
};

type SelectVariant = "light" | "dark";

const variantStyles: Record<SelectVariant, string> = {
  light: "border-slate-300 bg-white text-slate-800 focus:ring-slate-900/20",
  dark:  "border-[var(--c-border)] bg-[var(--c-input-bg)] text-[var(--c-text)]",
};

// ─── Select simple (native) ───────────────────────────────────────────────────
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  variant = "light",
  className,
  selectClassName,
  id,
  name,
}: {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  variant?: SelectVariant;
  className?: string;
  selectClassName?: string;
  id?: string;
  name?: string;
}) {
  const selectId = id ?? name;

  return (
    <div className={cn("space-y-1", className)}>
      {label && <Label name={label} color={variant === "dark" ? "white" : "slate"} size="xs" />}

      <select
        id={selectId}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2",
          variantStyles[variant],
          disabled && "opacity-60 cursor-not-allowed",
          selectClassName
        )}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── MultiSelect con buscador ─────────────────────────────────────────────────
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  disabled = false,
  maxDisplay = 3,
  variant = "light",
  className,
}: {
  label?: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  maxDisplay?: number;
  variant?: SelectVariant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, search]);

  function toggle(val: string) {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  }

  const displayLabel = useMemo(() => {
    if (value.length === 0) return placeholder;
    const labels = value.slice(0, maxDisplay).map((v) => options.find((o) => o.value === v)?.label ?? v);
    const extra = value.length - maxDisplay;
    return labels.join(", ") + (extra > 0 ? ` y ${extra} más` : "");
  }, [value, options, placeholder, maxDisplay]);

  const isDark = variant === "dark";

  return (
    <div className={cn("space-y-1 relative", className)} ref={ref}>
      {label && <Label name={label} color={isDark ? "white" : "slate"} size="xs" />}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left",
          "focus:outline-none focus:ring-2",
          variantStyles[variant],
          disabled && "opacity-60 cursor-not-allowed",
          open && "ring-2"
        )}
      >
        <span className={value.length === 0 ? "opacity-40" : ""}>{displayLabel}</span>
        <svg className={cn("w-4 h-4 opacity-40 transition-transform", open && "rotate-180")}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={cn(
          "absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden",
          isDark ? "border-[var(--c-border-med)] bg-[var(--c-surface)]" : "border-slate-200 bg-white"
        )}>
          <div className={cn("p-2 border-b", isDark ? "border-[var(--c-border)]" : "border-slate-100")}>
            <input
              autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                "w-full rounded-lg border px-3 py-1.5 text-sm outline-none",
                isDark ? "border-[var(--c-border)] bg-[var(--c-input-bg)] text-[var(--c-text)] placeholder:text-[var(--c-text-4)]"
                       : "border-slate-200 bg-white text-slate-800"
              )}
            />
          </div>
          <ul className="max-h-52 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className={cn("px-3 py-2 text-sm", isDark ? "text-[var(--c-text-4)]" : "text-slate-400")}>Sin resultados</li>
            )}
            {filtered.map((opt) => {
              const sel = value.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button type="button" disabled={opt.disabled} onClick={() => toggle(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition",
                      isDark
                        ? sel ? "bg-[var(--c-hover)] text-[var(--c-text)]" : "text-[var(--c-text-2)] hover:bg-[var(--c-hover)]"
                        : sel ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
                      opt.disabled && "opacity-40 cursor-not-allowed"
                    )}>
                    <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      sel
                        ? isDark ? "bg-[var(--c-text-2)] border-[var(--c-text-2)]" : "bg-slate-900 border-slate-900"
                        : isDark ? "border-[var(--c-border-med)]" : "border-slate-300"
                    )}>
                      {sel && (
                        <svg className={cn("w-2.5 h-2.5", isDark ? "text-slate-900" : "text-white")}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {opt.icon && <span>{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {value.length > 0 && (
            <div className={cn("px-3 py-2 border-t", isDark ? "border-[var(--c-border)]" : "border-slate-100")}>
              <button type="button" onClick={() => onChange([])}
                className={cn("text-xs transition", isDark ? "text-[var(--c-text-4)] hover:text-[var(--c-text-2)]" : "text-slate-500 hover:text-slate-800")}>
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SearchSelect (single con buscador) ──────────────────────────────────────
export function SearchSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  disabled = false,
  clearable = false,
  variant = "light",
  className,
}: {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  variant?: SelectVariant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const selectedOption = options.find((o) => o.value === value);
  const isDark = variant === "dark";

  return (
    <div className={cn("space-y-1 relative", className)} ref={ref}>
      {label && <Label name={label} color={isDark ? "white" : "slate"} size="xs" />}

      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left",
          "focus:outline-none focus:ring-2",
          variantStyles[variant],
          disabled && "opacity-60 cursor-not-allowed",
          open && "ring-2"
        )}>
        <span className={cn("flex items-center gap-2", !selectedOption && "opacity-40")}>
          {selectedOption?.icon}{selectedOption?.label ?? placeholder}
        </span>
        <div className="flex items-center gap-1">
          {clearable && value && (
            <span role="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
              className="opacity-40 hover:opacity-80 p-0.5 rounded">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg className={cn("w-4 h-4 opacity-40 transition-transform", open && "rotate-180")}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className={cn(
          "absolute z-50 mt-1 w-full rounded-xl border shadow-lg overflow-hidden",
          isDark ? "border-[var(--c-border-med)] bg-[var(--c-surface)]" : "border-slate-200 bg-white"
        )}>
          <div className={cn("p-2 border-b", isDark ? "border-[var(--c-border)]" : "border-slate-100")}>
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                "w-full rounded-lg border px-3 py-1.5 text-sm outline-none",
                isDark ? "border-[var(--c-border)] bg-[var(--c-input-bg)] text-[var(--c-text)] placeholder:text-[var(--c-text-4)]"
                       : "border-slate-200 bg-white text-slate-800"
              )} />
          </div>
          <ul className="max-h-52 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className={cn("px-3 py-2 text-sm", isDark ? "text-[var(--c-text-4)]" : "text-slate-400")}>Sin resultados</li>
            )}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button type="button" disabled={opt.disabled}
                  onClick={() => { onChange(opt.value); setOpen(false); setSearch(""); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition",
                    isDark
                      ? value === opt.value ? "bg-[var(--c-hover)] text-[var(--c-text)] font-medium" : "text-[var(--c-text-2)] hover:bg-[var(--c-hover)]"
                      : value === opt.value ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-700 hover:bg-slate-50",
                    opt.disabled && "opacity-40 cursor-not-allowed"
                  )}>
                  {opt.icon && <span>{opt.icon}</span>}
                  {opt.label}
                  {value === opt.value && (
                    <svg className="w-3.5 h-3.5 ml-auto opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
