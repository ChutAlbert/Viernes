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

export default function AppTopbar({ onOpenSidebar }) {
  const location = useLocation();
  const label = ROUTE_LABELS[location.pathname] ?? "Dashboard";
  const { theme, toggle } = useTheme();

  return (
    <header
      className="h-16 px-4 md:px-6 flex items-center gap-4 flex-shrink-0 backdrop-blur-md"
      style={{
        background: "var(--c-shell)",
        borderBottom: "1px solid var(--c-border-med)",
      }}
    >
      {/* Mobile menu — solo en mobile */}
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

      {/* Theme toggle */}
      <IconBtn onClick={toggle} title={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
        {theme === "dark" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </IconBtn>

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
