import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";

const ICON_OVERVIEW = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const ICON_GMAIL = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
  </svg>
);
const ICON_CHAT = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ICON_DOCS = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
);
const ICON_WEBSITE = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
  </svg>
);
const ICON_PIEZAS = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);
const ICON_CATALOGO = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
);
const ICON_INVENTARIO = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);

const NAV = [
  { to: "/app",           label: "Overview",    icon: ICON_OVERVIEW,  end: true },
  { to: "/app/gmail",     label: "Gmail",       icon: ICON_GMAIL },
  { to: "/app/chat",      label: "Chat IA",     icon: ICON_CHAT },
  { to: "/app/docs",      label: "Documentos",  icon: ICON_DOCS },
  { to: "/app/website",   label: "Website",     icon: ICON_WEBSITE },
  { to: "/app/piezas",    label: "Piezas 3D",   icon: ICON_PIEZAS },
  { to: "/app/catalogo",   label: "Catálogo",    icon: ICON_CATALOGO },
  { to: "/app/inventario", label: "Inventario",  icon: ICON_INVENTARIO },
];

export default function AppSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{ background: "var(--c-shell)", borderRight: "1px solid var(--c-border-med)" }}
    >
      {/* Logo */}
      <div
        className="px-5 py-4 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid var(--c-border-med)" }}
      >
        <img src="/Logo_sf.png" alt="Viernes" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
        <span className="font-semibold tracking-wide text-sm" style={{ color: "var(--c-text)" }}>Viernes</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
          Menú
        </p>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={({ isActive }) => isActive
              ? { background: "var(--c-hover-2)", color: "var(--c-text)", borderLeft: "2px solid var(--c-accent)", paddingLeft: "10px" }
              : { color: "var(--c-text-3)", borderLeft: "2px solid transparent", paddingLeft: "10px" }
            }
            onMouseEnter={(e) => {
              const active = e.currentTarget.style.borderLeftColor === "var(--c-accent)" ||
                             e.currentTarget.style.background.includes("hover-2");
              if (!active) {
                e.currentTarget.style.background = "var(--c-hover)";
                e.currentTarget.style.color = "var(--c-text-2)";
              }
            }}
            onMouseLeave={(e) => {
              const active = e.currentTarget.style.borderLeftColor === "var(--c-accent)" ||
                             e.currentTarget.style.background.includes("hover-2");
              if (!active) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--c-text-3)";
              }
            }}
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? "var(--c-accent)" : "var(--c-text-4)" }}>{icon}</span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-2" style={{ borderTop: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--c-hover)" }}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            JR
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--c-text-2)" }}>Jesus Rico</p>
            <p className="text-[10px] truncate" style={{ color: "var(--c-text-4)" }}>Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: "var(--c-text-3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-text-3)"; }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
