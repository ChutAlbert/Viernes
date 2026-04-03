import { useState, useEffect, useCallback } from "react";
import { Surface, Button, Input, Textarea, Label, Select, Modal } from "@viernes/ui/react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("viernes_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "settings", label: "Configuración" },
  { id: "services", label: "Servicios" },
  { id: "contacts", label: "Contacto" },
  { id: "members", label: "Equipo" },
];

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [form, setForm] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_description: "",
    company_name: "",
    company_tagline: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiFetch("/website/admin/settings")
      .then((list) => {
        const map = {};
        list.forEach(({ key, value }) => (map[key] = value));
        setForm((f) => ({ ...f, ...map }));
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await apiFetch("/website/admin/settings/bulk", {
        method: "POST",
        body: JSON.stringify({ settings: form }),
      });
      setMsg("Guardado correctamente.");
    } catch {
      setMsg("Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key, label, multiline = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      {multiline ? (
        <Textarea
          id={key}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          rows={3}
        />
      ) : (
        <Input
          id={key}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <Surface className="p-6 space-y-5">
      <h2 className="text-white font-semibold text-lg">Configuración del sitio</h2>
      {field("company_name", "Nombre de la empresa")}
      {field("company_tagline", "Tagline")}
      {field("hero_title", "Título del Hero")}
      {field("hero_subtitle", "Subtítulo del Hero")}
      {field("hero_description", "Descripción del Hero", true)}
      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
        {msg && <span className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</span>}
      </div>
    </Surface>
  );
}

// ── Services Tab ──────────────────────────────────────────────────────────────
const ICONS = ["code", "printer", "layout", "lightbulb", "globe", "database"];
const CATEGORIES = ["software", "hardware", "design", "consulting", "general"];

const EMPTY_SERVICE = { title: "", description: "", icon: "code", category: "general", order_index: 0, is_active: true };

function ServicesTab() {
  const [services, setServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_SERVICE);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/website/admin/services").then(setServices).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY_SERVICE); setModalOpen(true); }
  function openEdit(svc) { setEditing(svc); setForm({ ...svc }); setModalOpen(true); }

  async function save() {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/website/admin/services/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await apiFetch("/website/admin/services", { method: "POST", body: JSON.stringify(form) });
      }
      setModalOpen(false);
      load();
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este servicio?")) return;
    await apiFetch(`/website/admin/services/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Servicios</h2>
        <Button onClick={openCreate}>+ Agregar servicio</Button>
      </div>

      <div className="grid gap-3">
        {services.map((svc) => (
          <Surface key={svc.id} className="p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{svc.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${svc.is_active ? "bg-green-900/50 text-green-400" : "bg-white/10 text-white/40"}`}>
                  {svc.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-white/60 text-sm mt-1 line-clamp-2">{svc.description}</p>
              <div className="flex gap-3 mt-2 text-xs text-white/40">
                <span>Icono: {svc.icon}</span>
                <span>Categoría: {svc.category}</span>
                <span>Orden: {svc.order_index}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(svc)} className="text-white/50 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-white/10">
                Editar
              </button>
              <button onClick={() => remove(svc.id)} className="text-red-400/70 hover:text-red-400 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20">
                Eliminar
              </button>
            </div>
          </Surface>
        ))}
        {services.length === 0 && (
          <Surface className="p-8 text-center text-white/40">No hay servicios. Agrega el primero.</Surface>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar servicio" : "Nuevo servicio"}>
        <div className="space-y-4 p-1">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Icono</Label>
              <Select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}>
                {ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input type="number" value={form.order_index} onChange={(e) => setForm((f) => ({ ...f, order_index: +e.target.value }))} />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-400"
                />
                <span className="text-sm text-white/70">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Contacts Tab ──────────────────────────────────────────────────────────────
const CONTACT_TYPES = ["phone", "email", "whatsapp", "other"];
const EMPTY_CONTACT = { contact_type: "email", label: "", value: "", is_active: true };

function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/website/admin/contacts").then(setContacts).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY_CONTACT); setModalOpen(true); }
  function openEdit(c) { setEditing(c); setForm({ ...c }); setModalOpen(true); }

  async function save() {
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/website/admin/contacts/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await apiFetch("/website/admin/contacts", { method: "POST", body: JSON.stringify(form) });
      }
      setModalOpen(false);
      load();
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este contacto?")) return;
    await apiFetch(`/website/admin/contacts/${id}`, { method: "DELETE" });
    load();
  }

  const typeEmoji = { phone: "📞", email: "📧", whatsapp: "💬", other: "🔗" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Información de Contacto</h2>
        <Button onClick={openCreate}>+ Agregar contacto</Button>
      </div>

      <div className="grid gap-3">
        {contacts.map((c) => (
          <Surface key={c.id} className="p-4 flex items-center gap-4">
            <span className="text-2xl">{typeEmoji[c.contact_type] ?? "🔗"}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold">{c.label}</div>
              <div className="text-white/60 text-sm">{c.value}</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-900/50 text-green-400" : "bg-white/10 text-white/40"}`}>
              {c.is_active ? "Activo" : "Inactivo"}
            </span>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="text-white/50 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-white/10">Editar</button>
              <button onClick={() => remove(c.id)} className="text-red-400/70 hover:text-red-400 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20">Eliminar</button>
            </div>
          </Surface>
        ))}
        {contacts.length === 0 && (
          <Surface className="p-8 text-center text-white/40">No hay contactos. Agrega el primero.</Surface>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar contacto" : "Nuevo contacto"}>
        <div className="space-y-4 p-1">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.contact_type} onChange={(e) => setForm((f) => ({ ...f, contact_type: e.target.value }))}>
              {CONTACT_TYPES.map((t) => <option key={t} value={t}>{typeEmoji[t]} {t}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Etiqueta (ej: WhatsApp MX)</Label>
            <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor (número, email o URL)</Label>
            <Input value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-cyan-400" />
            <span className="text-sm text-white/70">Activo</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Members Tab ───────────────────────────────────────────────────────────────
const EMPTY_MEMBER = { name: "", role: "", bio: "", avatar_url: "", github_url: "", linkedin_url: "", order_index: 0, is_active: true };

function MembersTab() {
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    apiFetch("/website/admin/members").then(setMembers).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY_MEMBER); setModalOpen(true); }
  function openEdit(m) { setEditing(m); setForm({ ...m, bio: m.bio ?? "", avatar_url: m.avatar_url ?? "", github_url: m.github_url ?? "", linkedin_url: m.linkedin_url ?? "" }); setModalOpen(true); }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, bio: form.bio || null, avatar_url: form.avatar_url || null, github_url: form.github_url || null, linkedin_url: form.linkedin_url || null };
      if (editing) {
        await apiFetch(`/website/admin/members/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/website/admin/members", { method: "POST", body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      load();
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este miembro?")) return;
    await apiFetch(`/website/admin/members/${id}`, { method: "DELETE" });
    load();
  }

  const f = (key, label, opts = {}) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={form[key]} onChange={(e) => setForm((fm) => ({ ...fm, [key]: e.target.value }))} {...opts} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Equipo</h2>
        <Button onClick={openCreate}>+ Agregar miembro</Button>
      </div>

      <div className="grid gap-3">
        {members.map((m) => (
          <Surface key={m.id} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
              {m.avatar_url ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" /> : m.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold">{m.name}</div>
              <div className="text-cyan-400 text-sm">{m.role}</div>
              {m.bio && <p className="text-white/50 text-xs mt-1 line-clamp-1">{m.bio}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(m)} className="text-white/50 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-white/10">Editar</button>
              <button onClick={() => remove(m.id)} className="text-red-400/70 hover:text-red-400 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20">Eliminar</button>
            </div>
          </Surface>
        ))}
        {members.length === 0 && (
          <Surface className="p-8 text-center text-white/40">No hay miembros. Agrega el primero.</Surface>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar miembro" : "Nuevo miembro"}>
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-2 gap-3">
            {f("name", "Nombre")}
            {f("role", "Rol / Puesto")}
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea rows={2} value={form.bio} onChange={(e) => setForm((fm) => ({ ...fm, bio: e.target.value }))} />
          </div>
          {f("avatar_url", "URL de avatar (imagen)", { placeholder: "https://..." })}
          {f("github_url", "GitHub URL", { placeholder: "https://github.com/..." })}
          {f("linkedin_url", "LinkedIn URL", { placeholder: "https://linkedin.com/in/..." })}
          <div className="grid grid-cols-2 gap-3 items-end">
            {f("order_index", "Orden")}
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((fm) => ({ ...fm, is_active: e.target.checked }))} className="w-4 h-4 accent-cyan-400" />
              <span className="text-sm text-white/70">Activo</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Website() {
  const [activeTab, setActiveTab] = useState("settings");

  const tabContent = {
    settings: <SettingsTab />,
    services: <ServicesTab />,
    contacts: <ContactsTab />,
    members: <MembersTab />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Gestión del Website</h1>
        <p className="text-white/50 text-sm mt-1">Administra el contenido público de tu sitio web.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "text-cyan-400 border-cyan-400"
                : "text-white/50 border-transparent hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>{tabContent[activeTab]}</div>
    </div>
  );
}
