import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { useFeatures } from "@/lib/features";

// ── Item icons ───────────────────────────────────────────────────────────────
const ICON_OVERVIEW = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const ICON_GMAIL = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
  </svg>
);
const ICON_CHAT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ICON_DOCS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
);
const ICON_TASKS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const ICON_NOTES = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const ICON_WEBSITE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
  </svg>
);
const ICON_CATALOGO = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>
    <rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
  </svg>
);
const ICON_PIEZAS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);
const ICON_FILAMENTO = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21"/>
  </svg>
);
const ICON_INVENTARIO = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const ICON_REDES = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);
const ICON_PRECIOS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/>
  </svg>
);
const ICON_QR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M21 14v3"/>
  </svg>
);
const ICON_SPOTIFY = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.517 17.398a.75.75 0 0 1-1.031.25c-2.827-1.728-6.387-2.12-10.582-1.16a.75.75 0 0 1-.334-1.463c4.588-1.047 8.524-.596 11.697 1.342a.75.75 0 0 1 .25 1.031zm1.47-3.272a.937.937 0 0 1-1.288.308C14.87 12.424 11.1 11.95 7.5 12.98a.937.937 0 0 1-.525-1.8c4.056-1.18 8.266-.608 11.698 1.658a.938.938 0 0 1 .314 1.288zm.127-3.411C15.76 8.49 9.99 8.3 6.578 9.325a1.125 1.125 0 1 1-.652-2.152C9.89 5.998 16.327 6.22 20.027 8.55a1.125 1.125 0 0 1-.913 2.065v.1z"/>
  </svg>
);
const ICON_VAULT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="12" cy="16" r="1" fill="currentColor"/>
  </svg>
);
const ICON_USERS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ICON_GALLERY = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const ICON_MAP = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);

const ICON_CONFIG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

// ── Workspace (rail) icons ───────────────────────────────────────────────────
const WICON_PERSONAL = (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 16 0v1"/>
  </svg>
);
const WICON_SODIGIC = (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 2 7l10 5 10-5z"/><path d="M2 7v10l10 5 10-5V7"/><path d="M12 12v10"/>
  </svg>
);
const WICON_ADMIN = (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z"/><path d="M9 12l2 2 4-4"/>
  </svg>
);

function IconChevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ transition: "transform 200ms", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── Workspaces ───────────────────────────────────────────────────────────────
// Each workspace has its own accent color. Items keep their existing /app/* routes.
const WORKSPACES = [
  {
    key: "viernes", label: "Viernes", color: "#7c3aed",
    sub: "Tu asistente y centro de mando.",
    items: [
      { to: "/app",       label: "Overview",    icon: ICON_OVERVIEW, key: "overview", end: true },
      { to: "/app/chat",  label: "Chat IA",     icon: ICON_CHAT,     key: "chat" },
      { to: "/app/gmail", label: "Gmail",       icon: ICON_GMAIL,    key: "gmail" },
      { to: "/app/docs",  label: "Documentos",  icon: ICON_DOCS,     key: "docs" },
    ],
  },
  {
    key: "personal", label: "Personal", color: "#22d3ee",
    sub: "Tu día a día: tareas, notas y utilidades.",
    items: [
      { to: "/app/tareas",    label: "Tareas",       icon: ICON_TASKS,   key: "tareas" },
      { to: "/app/notas",     label: "Notas",        icon: ICON_NOTES,   key: "notas" },
      { group: "Utilidades" },
      { to: "/app/qr",        label: "Generador QR", icon: ICON_QR,      key: "qr" },
      { to: "/app/passwords", label: "Contraseñas",  icon: ICON_VAULT,   key: "passwords" },
      { to: "/app/spotify",   label: "Spotify",      icon: ICON_SPOTIFY, key: "spotify" },
    ],
  },
  {
    key: "sodigic", label: "Sodigic", color: "#f59e0b",
    sub: "El negocio: catálogo, producción y web.",
    items: [
      { to: "/app/website",    label: "Website",        icon: ICON_WEBSITE,    key: "website" },
      { to: "/app/piezas",     label: "Piezas",         icon: ICON_PIEZAS,     key: "piezas" },
      { to: "/app/filamentos", label: "Filamentos",     icon: ICON_FILAMENTO,  key: "filamentos" },
      { to: "/app/inventario", label: "Inventario",     icon: ICON_INVENTARIO, key: "inventario" },
      { to: "/app/precios",    label: "Precios",        icon: ICON_PRECIOS,    key: "precios", feature: "precios" },
    ],
  },
  {
    key: "admin", label: "Admin", color: "#10b981", adminOnly: true,
    sub: "Gestión del sistema y accesos.",
    items: [
      { to: "/app/usuarios",    label: "Usuarios",    icon: ICON_USERS,   key: "usuarios",    roles: ["admin", "super_admin"] },
      { to: "/app/galeria",     label: "Visitas",     icon: ICON_GALLERY, key: "galeria",     roles: ["super_admin"] },
      { to: "/app/ubicaciones", label: "Ubicaciones", icon: ICON_MAP,     key: "ubicaciones", roles: ["admin", "super_admin"] },
      { to: "/app/config",      label: "Configuración", icon: ICON_CONFIG, key: "config",      roles: ["admin", "super_admin"] },
    ],
  },
];

const WICONS = { personal: WICON_PERSONAL, sodigic: WICON_SODIGIC, admin: WICON_ADMIN };

// ── Helpers ──────────────────────────────────────────────────────────────────
function canAccess(key, user) {
  if (!user) return true;
  if (user.role === "admin" || user.role === "super_admin") return true;
  if (!user.permissions) return true;
  return user.permissions[key] !== false;
}

function isAdminUser(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function visibleItems(ws, user) {
  // Los items con feature apagado se SIGUEN mostrando (deshabilitados), no se ocultan.
  return ws.items.filter((it) =>
    it.group || ((!it.roles || it.roles.includes(user?.role)) && canAccess(it.key, user))
  );
}

function isDisabled(it, features) {
  return !!(it.feature && features[it.feature] === false);
}

function visibleWorkspaces(user) {
  return WORKSPACES.filter((ws) => {
    if (ws.adminOnly && !isAdminUser(user)) return false;
    return visibleItems(ws, user).some((it) => !it.group);
  });
}

// Which workspace owns the current route.
function findWorkspaceKey(pathname) {
  for (const ws of WORKSPACES) {
    for (const it of ws.items) {
      if (!it.to) continue;
      if (it.to === "/app") { if (pathname === "/app") return ws.key; }
      else if (pathname === it.to || pathname.startsWith(it.to + "/")) return ws.key;
    }
  }
  return "viernes";
}

function getInitials(name, email) {
  const src = name || email || "?";
  return src.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ to, label, icon, end = false, color, disabled = false }) {
  if (disabled) {
    return (
      <div
        title="Desactivado — actívalo en Admin → Configuración"
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium select-none"
        style={{ color: "var(--c-text-4)", cursor: "not-allowed", borderLeft: "2px solid transparent", paddingLeft: "10px" }}
      >
        <span style={{ color: "var(--c-text-4)" }}>{icon}</span>
        <span className="flex-1">{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
    );
  }
  return (
    <NavLink
      to={to}
      end={end}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
      style={({ isActive }) => isActive
        ? { background: "var(--c-hover-2)", color: "var(--c-text)", borderLeft: `2px solid ${color}`, paddingLeft: "10px" }
        : { color: "var(--c-text-3)", borderLeft: "2px solid transparent", paddingLeft: "10px" }
      }
      onMouseEnter={(e) => {
        if (!e.currentTarget.style.background.includes("hover-2")) {
          e.currentTarget.style.background = "var(--c-hover)";
          e.currentTarget.style.color = "var(--c-text-2)";
        }
      }}
      onMouseLeave={(e) => {
        if (!e.currentTarget.style.background.includes("hover-2")) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--c-text-3)";
        }
      }}
    >
      {({ isActive }) => (
        <>
          <span style={{ color: isActive ? color : "var(--c-text-4)" }}>{icon}</span>
          {label}
        </>
      )}
    </NavLink>
  );
}

// ── Rail button ──────────────────────────────────────────────────────────────
function RailButton({ ws, active, onClick }) {
  const railIcon = ws.key === "viernes"
    ? <img src="/Logo_sf.png" alt="" className="w-6 h-6 rounded-md object-contain" />
    : WICONS[ws.key];

  return (
    <button
      onClick={onClick}
      title={ws.label}
      className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150"
      style={active
        ? { background: `color-mix(in srgb, ${ws.color} 18%, transparent)`, border: `1px solid color-mix(in srgb, ${ws.color} 40%, transparent)`, color: ws.color }
        : { border: "1px solid transparent", color: "var(--c-text-3)" }
      }
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "var(--c-text-2)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-text-3)"; } }}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r"
          style={{ background: ws.color }} />
      )}
      {railIcon}
    </button>
  );
}

// ── AppSidebar ───────────────────────────────────────────────────────────────
export default function AppSidebar({ onNavigate }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);
  const features = useFeatures();

  const spaces = visibleWorkspaces(user);
  const [activeKey, setActiveKey] = useState(() => findWorkspaceKey(location.pathname));

  // Follow the route: navigating (incl. deep links) selects the owning workspace.
  useEffect(() => {
    setActiveKey(findWorkspaceKey(location.pathname));
  }, [location.pathname]);

  const activeWs = spaces.find((w) => w.key === activeKey) || spaces[0];
  const items = visibleItems(activeWs, user);

  // Clicking a rail icon jumps to that workspace's first enabled item.
  const switchWorkspace = (ws) => {
    setActiveKey(ws.key);
    const first = visibleItems(ws, user).find((it) => it.to && !isDisabled(it, features));
    if (first) navigate(first.to);
  };

  const displayName = user?.name || user?.email || "Usuario";
  const displayRole = isAdminUser(user) ? "Admin" : "Usuario";
  const displayInitials = getInitials(user?.name, user?.email);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <aside className="flex h-full" style={{ background: "var(--c-shell)", borderRight: "1px solid var(--c-border-med)" }}>
      {/* ── Rail: workspace switcher ── */}
      <div className="flex flex-col items-center gap-2 py-4 px-2.5 flex-shrink-0"
        style={{ borderRight: "1px solid var(--c-border)" }}>
        {spaces.map((ws) => (
          <RailButton key={ws.key} ws={ws} active={ws.key === activeKey} onClick={() => switchWorkspace(ws)} />
        ))}
      </div>

      {/* ── Contextual column ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border-med)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
            Espacio
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: activeWs.color }} />
            <span className="font-semibold text-base tracking-tight" style={{ color: "var(--c-text)" }}>{activeWs.label}</span>
          </div>
          <p className="text-[11px] mt-1.5 leading-snug" style={{ color: "var(--c-text-3)" }}>{activeWs.sub}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5" onClick={() => onNavigate?.()}>
          {items.map((it, i) =>
            it.group ? (
              <p key={`g-${i}`} className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-3 pb-1"
                style={{ color: "var(--c-text-4)" }}>{it.group}</p>
            ) : (
              <NavItem key={it.to} to={it.to} label={it.label} icon={it.icon} end={it.end} color={activeWs.color} disabled={isDisabled(it, features)} />
            )
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 space-y-2 flex-shrink-0" style={{ borderTop: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--c-hover)" }}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {displayInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--c-text-2)" }}>{displayName}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--c-text-4)" }}>{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: "var(--c-text-3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-text-3)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
