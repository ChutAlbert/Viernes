import { useState, useRef, useEffect } from "react";

// Select temado reutilizable (dropdown propio, respeta las variables --c-*).
// Evita el estilado nativo del <select> del sistema operativo.
export default function Select({ value, onChange, options, placeholder = "Seleccionar", disabled = false, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-left transition-colors disabled:opacity-40"
        style={{ background: "var(--c-input-bg)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
      >
        <span className="truncate">{current ? current.label : placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ color: "var(--c-text-4)", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 z-50 rounded-xl p-1 shadow-xl max-h-60 overflow-auto"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)" }}
          role="listbox"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-sm transition-colors"
                style={{ background: active ? "var(--c-hover-2)" : "transparent", color: active ? "var(--c-text)" : "var(--c-text-2)" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--c-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
