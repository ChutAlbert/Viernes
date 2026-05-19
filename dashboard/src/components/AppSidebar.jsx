import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";

// ── Icons ────────────────────────────────────────────────────────────────────
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
const ICON_QR = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h3v3"/><path d="M17 17h4"/><path d="M21 14v3"/>
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
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ICON_GALLERY = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

function IconChevron({ open }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ transition: "transform 200ms", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── Nav groups ───────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    key: "viernes",
    label: "Viernes",
    items: [
      { to: "/app/chat",  label: "Chat IA",    icon: ICON_CHAT,  key: "chat" },
      { to: "/app/gmail", label: "Gmail",       icon: ICON_GMAIL, key: "gmail" },
      { to: "/app/docs",  label: "Documentos",  icon: ICON_DOCS,  key: "docs" },
    ],
  },
  {
    key: "agenda",
    label: "Agenda",
    items: [
      { to: "/app/tareas", label: "Tareas", icon: ICON_TASKS, key: "tareas" },
      { to: "/app/notas",  label: "Notas",  icon: ICON_NOTES, key: "notas" },
    ],
  },
  {
    key: "sodigic",
    label: "Sodigic",
    items: [
      { to: "/app/website",    label: "Website",        icon: ICON_WEBSITE,    key: "website" },
      { to: "/app/catalogo",   label: "Catálogo",       icon: ICON_CATALOGO,   key: "catalogo" },
      { to: "/app/piezas",     label: "Piezas 3D",      icon: ICON_PIEZAS,     key: "piezas" },
      { to: "/app/inventario", label: "Inventario",     icon: ICON_INVENTARIO, key: "inventario" },
      { to: "/app/redes",      label: "Redes Sociales", icon: ICON_REDES,      key: "redes" },
    ],
  },
  {
    key: "funciones",
    label: "Funciones",
    items: [
      { to: "/app/qr",        label: "Generador QR", icon: ICON_QR,    key: "qr" },
      { to: "/app/passwords", label: "Contraseñas",  icon: ICON_VAULT, key: "passwords" },
    ],
  },
];

const ICON_MAP = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);

const ADMIN_GROUP = {
  key: "admin",
  label: "Administración",
  items: [
    { to: "/app/usuarios",   label: "Usuarios",    icon: ICON_USERS,   roles: ["admin", "super_admin"] },
    { to: "/app/galeria",    label: "Visitas",      icon: ICON_GALLERY, roles: ["super_admin"] },
    { to: "/app/ubicaciones",label: "Ubicaciones",  icon: ICON_MAP,     roles: ["admin", "super_admin"] },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function canAccess(key, user) {
  if (!user) return true;
  if (user.role === "admin" || user.role === "super_admin") return true;
  if (!user.permissions) return true;
  return user.permissions[key] !== false;
}

function getInitials(name, email) {
  const src = name || email || "?";
  return src.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function groupHasActiveRoute(group, pathname) {
  return group.items.some((item) => pathname.startsWith(item.to));
}

// ── NavItem component ────────────────────────────────────────────────────────
function NavItem({ to, label, icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
      style={({ isActive }) => isActive
        ? { background: "var(--c-hover-2)", color: "var(--c-text)", borderLeft: "2px solid var(--c-accent)", paddingLeft: "10px" }
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
          <span style={{ color: isActive ? "var(--c-accent)" : "var(--c-text-4)" }}>{icon}</span>
          {label}
        </>
      )}
    </NavLink>
  );
}

// ── NavGroup component ───────────────────────────────────────────────────────
function NavGroup({ group, open, onToggle, user }) {
  const visibleItems = group.items.filter((item) =>
    (!item.roles || item.roles.includes(user?.role)) && canAccess(item.key, user)
  );

  if (visibleItems.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors"
        style={{ color: "var(--c-text-4)" }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--c-text-3)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-4)"}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest">{group.label}</span>
        <IconChevron open={open} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {visibleItems.map(({ to, label, icon, end }) => (
            <NavItem key={to} to={to} label={label} icon={icon} end={end} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── AppSidebar ───────────────────────────────────────────────────────────────
export default function AppSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const initOpen = () => {
    const open = new Set(NAV_GROUPS.map((g) => g.key));
    if (isAdmin) open.add("admin");
    return open;
  };

  const [openGroups, setOpenGroups] = useState(initOpen);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const displayName = user?.name || user?.email || "Usuario";
  const displayRole = isAdmin ? "Admin" : "Usuario";
  const displayInitials = getInitials(user?.name, user?.email);

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
        className="px-5 py-4 flex items-center gap-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-border-med)" }}
      >
        <img src="/Logo_sf.png" alt="Viernes" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
        <span className="font-semibold tracking-wide text-sm" style={{ color: "var(--c-text)" }}>Viernes</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3">

        {/* Home — solo */}
        <div className="space-y-0.5">
          <NavItem to="/app" label="Overview" icon={ICON_OVERVIEW} end />
        </div>

        {/* Grouped sections */}
        {NAV_GROUPS.map((group) => (
          <NavGroup
            key={group.key}
            group={group}
            open={openGroups.has(group.key)}
            onToggle={() => toggleGroup(group.key)}
            user={user}
          />
        ))}

        {/* Admin group */}
        {isAdmin && (
          <NavGroup
            group={ADMIN_GROUP}
            open={openGroups.has("admin")}
            onToggle={() => toggleGroup("admin")}
            user={user}
          />
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
    </aside>
  );
}
