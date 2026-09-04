import { useState, useEffect } from "react";
import { viernesApi } from "@/lib/apis/viernes";
import { ConfirmModal, Modal } from "@viernes/ui/react";

// Debe reflejar las claves NO restringidas por rol de AppSidebar.jsx.
// Una clave que falte aqui no se puede desactivar: canAccess() la deja pasar.
const ALL_SECTIONS = [
  { key: "overview",    label: "Overview" },
  { key: "chat",        label: "Chat IA" },
  { key: "gmail",       label: "Gmail" },
  { key: "docs",        label: "Documentos" },
  { key: "tareas",      label: "Tareas" },
  { key: "notas",       label: "Notas" },
  { key: "qr",          label: "Generador QR" },
  { key: "passwords",   label: "Contraseñas" },
  { key: "spotify",     label: "Spotify" },
  { key: "website",     label: "Website" },
  { key: "piezas",      label: "Piezas" },
  { key: "filamentos",  label: "Filamentos" },
  { key: "inventario",  label: "Inventario" },
  { key: "precios",     label: "Precios" },
];

const DEFAULT_PERMISSIONS = Object.fromEntries(ALL_SECTIONS.map((s) => [s.key, true]));

function initials(name, email) {
  const src = name || email || "?";
  return src
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
      style={
        isAdmin
          ? { background: "rgba(139,92,246,0.15)", color: "#a78bfa" }
          : { background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }
      }
    >
      {isAdmin ? "Admin" : "Usuario"}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={
        active
          ? { background: "rgba(34,197,94,0.12)", color: "#4ade80" }
          : { background: "var(--c-hover-2)", color: "var(--c-text-4)" }
      }
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function PermissionsGrid({ permissions, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1">
      {ALL_SECTIONS.map((s) => {
        const checked = permissions[s.key] !== false;
        return (
          <label
            key={s.key}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <button
              type="button"
              onClick={() => onChange({ ...permissions, [s.key]: !checked })}
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
              style={
                checked
                  ? { background: "var(--c-accent)", border: "1px solid var(--c-accent)" }
                  : { background: "transparent", border: "1px solid var(--c-border-med)" }
              }
            >
              {checked && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              )}
            </button>
            <span className="text-sm" style={{ color: checked ? "var(--c-text-2)" : "var(--c-text-4)" }}>
              {s.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "user",
  is_active: true,
  permissions: { ...DEFAULT_PERMISSIONS },
};

function Toggle({ value, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-3 group"
    >
      <span
        className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200"
        style={{ background: value ? "var(--c-accent)" : "var(--c-border-med)" }}
      >
        <span
          className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200"
          style={{ transform: value ? "translateX(1.25rem)" : "translateX(0)" }}
        />
      </span>
      <span className="text-sm select-none" style={{ color: value ? "var(--c-text-2)" : "var(--c-text-4)" }}>
        {label}
      </span>
    </button>
  );
}

function UserModal({ open, onClose, onSave, editUser }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (editUser) {
        setForm({
          name: editUser.name || "",
          email: editUser.email || "",
          password: "",
          role: editUser.role || "user",
          is_active: editUser.is_active !== false,
          permissions: editUser.permissions || { ...DEFAULT_PERMISSIONS },
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError("");
    }
  }, [open, editUser]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("El nombre es requerido"); return; }
    if (!form.email.trim()) { setError("El email es requerido"); return; }
    if (!editUser && !form.password) { setError("La contraseña es requerida"); return; }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
        permissions: form.role === "admin" ? null : form.permissions,
      };
      if (form.password) payload.password = form.password;
      await onSave(payload, editUser?.id);
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: "var(--c-input-bg, var(--c-hover))",
    color: "var(--c-text)",
    border: "1px solid var(--c-border)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };

  const labelStyle = { color: "var(--c-text-3)", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem", display: "block" };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--c-border)" }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--c-text)" }}>
          {editUser ? "Editar usuario" : "Nuevo usuario"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg transition-colors hover:bg-[var(--c-hover)]"
          style={{ color: "var(--c-text-4)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="juan@empresa.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>
              {editUser ? "Nueva contraseña" : "Contraseña"}
            </label>
            <input
              style={inputStyle}
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={editUser ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
            />
          </div>
          <div>
            <label style={labelStyle}>Rol</label>
            <div className="flex gap-2 mt-1">
              {["user", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("role", r)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={
                    form.role === r
                      ? { background: "var(--c-accent)", color: "#fff", border: "1px solid var(--c-accent)" }
                      : { background: "transparent", color: "var(--c-text-3)", border: "1px solid var(--c-border)" }
                  }
                >
                  {r === "admin" ? "Admin" : "Usuario"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Toggle
          value={form.is_active}
          onChange={(v) => set("is_active", v)}
          label={form.is_active ? "Usuario activo" : "Usuario inactivo"}
        />

        {form.role === "user" && (
          <div>
            <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>
              Secciones con acceso
            </label>
            <div
              className="rounded-xl p-3"
              style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}
            >
              <PermissionsGrid
                permissions={form.permissions}
                onChange={(p) => set("permissions", p)}
              />
            </div>
          </div>
        )}

        {form.role === "admin" && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(139,92,246,0.08)", color: "#a78bfa" }}>
            Los administradores tienen acceso completo a todas las secciones.
          </p>
        )}

        {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-[var(--c-hover)]"
            style={{ color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 hover:opacity-85"
            style={{ background: "var(--c-accent)", color: "#fff" }}
          >
            {saving ? "Guardando…" : editUser ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const all = await viernesApi.listUsers();
      setUsers(all.filter((u) => u.role !== "super_admin"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditUser(null);
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditUser(user);
    setModalOpen(true);
  }

  async function handleSave(payload, id) {
    if (id) {
      const updated = await viernesApi.updateUser(id, payload);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } else {
      const created = await viernesApi.createUser(payload);
      setUsers((prev) => [...prev, created]);
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await viernesApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>Usuarios</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--c-text-4)" }}>
            Gestión de accesos y permisos
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "var(--c-accent)", color: "#fff" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--c-text-4)" }}>Cargando…</p>
      ) : error ? (
        <p className="text-sm py-8 text-center" style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border-med)" }}>
          {/* Table header */}
          <div
            className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{ background: "var(--c-hover)", borderBottom: "1px solid var(--c-border)", color: "var(--c-text-4)" }}
          >
            <span className="w-8" />
            <span>Usuario</span>
            <span className="w-20">Rol</span>
            <span className="w-20">Estado</span>
            <span className="w-24 text-center">Secciones</span>
            <span className="w-16" />
          </div>

          {users.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--c-text-4)" }}>No hay usuarios</p>
          ) : (
            users.map((u, i) => (
              <div
                key={u.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center transition-colors"
                style={{ borderBottom: i < users.length - 1 ? "1px solid var(--c-border)" : "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: u.role === "admin" ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "linear-gradient(135deg,#0f766e,#0369a1)" }}
                >
                  {initials(u.name, u.email)}
                </div>

                {/* Name + email */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>
                    {u.name || <span style={{ color: "var(--c-text-4)" }}>Sin nombre</span>}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-4)" }}>{u.email}</p>
                </div>

                {/* Role */}
                <div className="w-20"><RoleBadge role={u.role} /></div>

                {/* Status */}
                <div className="w-20"><StatusBadge active={u.is_active} /></div>

                {/* Permissions summary */}
                <div className="w-24 text-center">
                  {u.role === "admin" ? (
                    <span className="text-xs" style={{ color: "var(--c-text-4)" }}>Todas</span>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>
                      {u.permissions
                        ? `${Object.values(u.permissions).filter(Boolean).length}/${ALL_SECTIONS.length}`
                        : "—"}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="w-16 flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEdit(u)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: "var(--c-text-4)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--c-text-2)"; e.currentTarget.style.background = "var(--c-hover-2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-text-4)"; e.currentTarget.style.background = ""; }}
                    title="Editar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setConfirmId(u.id)}
                    disabled={deleting === u.id}
                    className="p-1.5 rounded-lg transition-all"
                    style={{ color: "var(--c-text-4)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-text-4)"; e.currentTarget.style.background = ""; }}
                    title="Eliminar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editUser={editUser}
      />

      <ConfirmModal
        open={confirmId !== null}
        title="Eliminar usuario"
        description="¿Eliminar este usuario? Esta acción no se puede deshacer y revocará su acceso inmediatamente."
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
