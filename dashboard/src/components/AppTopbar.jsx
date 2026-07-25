import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/store/theme.jsx";

const ROUTE_LABELS = {
  "/app":         "Overview",
  "/app/gmail":   "Gmail",
  "/app/chat":    "Chat IA",
  "/app/docs":    "Documentos",
  "/app/website": "Website",
};

function IconBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--c-hover-2)]"
      style={{ border: "1px solid var(--c-border)", color: "var(--c-text-3)" }}
    >
      {children}
    </button>
  );
}

function Swatch({ colors, size = 18 }) {
  const [bg, accent] = colors;
  return (
    <span
      className="rounded-md flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: bg, border: "1px solid var(--c-border-med)", position: "relative" }}
    >
      <span style={{ position: "absolute", right: 0, bottom: 0, width: "55%", height: "55%", background: accent, borderTopLeftRadius: 4 }} />
    </span>
  );
}

function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
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

  const current = themes.find((t) => t.key === theme) || themes[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Cambiar tema"
        className="h-9 px-2.5 gap-2 rounded-xl flex items-center transition-colors hover:bg-[var(--c-hover-2)]"
        style={{ border: "1px solid var(--c-border)", color: "var(--c-text-3)" }}
      >
        <Swatch colors={current.swatch} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-2xl p-2 z-50 shadow-xl"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)" }}
          role="listbox"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest px-2.5 pt-1 pb-1.5" style={{ color: "var(--c-text-4)" }}>
            Tema
          </p>
          {themes.map((t) => {
            const active = t.key === theme;
            return (
              <button
                key={t.key}
                onClick={() => { setTheme(t.key); setOpen(false); }}
                role="option"
                aria-selected={active}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ background: active ? "var(--c-hover-2)" : "transparent", color: active ? "var(--c-text)" : "var(--c-text-2)" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--c-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Swatch colors={t.swatch} />
                <span className="flex-1 text-left">{t.label}</span>
                {active && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent-text)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppTopbar({ onOpenSidebar }) {
  const location = useLocation();
  const label = ROUTE_LABELS[location.pathname] ?? "Dashboard";

  return (
    <header
      className="h-16 px-4 md:px-6 flex items-center gap-4 flex-shrink-0 backdrop-blur-md"
      style={{ background: "var(--c-shell)", borderBottom: "1px solid var(--c-border-med)" }}
    >
      {/* Mobile menu */}
      <div className="md:hidden">
        <IconBtn onClick={onOpenSidebar} title="Menú">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </IconBtn>
      </div>

      {/* Title */}
      <h1 className="font-semibold text-sm tracking-tight hidden md:block" style={{ color: "var(--c-text)" }}>
        {label}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div
        className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 w-60"
        style={{ background: "var(--c-input-bg)", border: "1px solid var(--c-border)" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--c-text-4)", flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="bg-transparent text-sm outline-none w-full placeholder:opacity-40"
          style={{ color: "var(--c-text-2)" }}
          placeholder="Buscar..."
        />
      </div>

      {/* Theme picker */}
      <ThemePicker />

      {/* Notifications */}
      <div className="relative">
        <IconBtn title="Notificaciones">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </IconBtn>
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-400 rounded-full pointer-events-none" />
      </div>
    </header>
  );
}
