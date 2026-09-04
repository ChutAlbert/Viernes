import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Surface, Button, Input, Textarea, Label, Modal, SearchSelect, FileInput, ConfirmModal } from "@viernes/ui/react";

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
    catalogo_nota_colores: "",
    solicitud_piezas_activa: "false",
    ver_3d_activo: "true",
    maintenance_mode: "false",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Toggles de ajuste: guardan al instante (no esperan al botón Guardar)
  async function toggleAjuste(clave, mensaje) {
    const next = form[clave] === "true" ? "false" : "true";
    const newForm = { ...form, [clave]: next };
    setForm(newForm);
    try {
      await apiFetch("/website/admin/settings/bulk", { method: "POST", body: JSON.stringify({ settings: newForm }) });
      setMsg(mensaje ? mensaje(next === "true") : "Guardado.");
    } catch { setMsg("Error al guardar."); }
  }

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

  return (
    <Surface className="p-6 space-y-5">
      <h2 className="font-semibold text-lg" style={{ color: "var(--c-text)" }}>Configuración del sitio</h2>

      {/* Modo mantenimiento — aplica al instante */}
      <div className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: form.maintenance_mode === "true" ? "rgba(245,158,11,0.12)" : "var(--c-hover)", border: form.maintenance_mode === "true" ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--c-border)" }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Modo mantenimiento</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>
            {form.maintenance_mode === "true"
              ? "El sitio muestra pantalla de mantenimiento a los visitantes (tú lo ves normal)."
              : "El sitio está en línea normalmente."}
          </p>
        </div>
        <button type="button" onClick={() => toggleAjuste("maintenance_mode", (on) => on ? "Modo mantenimiento ACTIVADO." : "Modo mantenimiento desactivado.")} role="switch" aria-checked={form.maintenance_mode === "true"}
          style={{ width: 46, height: 26, borderRadius: 999, position: "relative", cursor: "pointer", flexShrink: 0,
                   border: "1px solid var(--c-border-med)", background: form.maintenance_mode === "true" ? "#f59e0b" : "var(--c-input-bg)" }}>
          <span style={{ position: "absolute", top: 2, left: form.maintenance_mode === "true" ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
        </button>
      </div>

      {/* Vista 3D en el catálogo */}
      <div className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Ver modelo 3D en el sitio</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>
            {form.ver_3d_activo !== "false"
              ? "Las piezas con archivo 3D muestran el botón para verlo en 3D."
              : "Solo se muestran las fotos; el visor 3D queda oculto."}
          </p>
        </div>
        <button type="button" onClick={() => toggleAjuste("ver_3d_activo")} role="switch"
          aria-checked={form.ver_3d_activo !== "false"}
          style={{ width: 46, height: 26, borderRadius: 999, position: "relative", cursor: "pointer", flexShrink: 0,
                   border: "1px solid var(--c-border-med)", background: form.ver_3d_activo !== "false" ? "var(--c-accent)" : "var(--c-input-bg)" }}>
          <span style={{ position: "absolute", top: 2, left: form.ver_3d_activo !== "false" ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
        </button>
      </div>

      {/* Solicitud de piezas — aplica al instante */}
      <div className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Solicitud de piezas</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>
            {form.solicitud_piezas_activa === "true"
              ? 'El botón dice "Solicitar esta pieza" y lleva los datos al contacto.'
              : 'El botón dice "Ponte en contacto" y solo lleva a la página de contacto.'}
          </p>
        </div>
        <button type="button" onClick={() => toggleAjuste("solicitud_piezas_activa")} role="switch"
          aria-checked={form.solicitud_piezas_activa === "true"}
          style={{ width: 46, height: 26, borderRadius: 999, position: "relative", cursor: "pointer", flexShrink: 0,
                   border: "1px solid var(--c-border-med)", background: form.solicitud_piezas_activa === "true" ? "var(--c-accent)" : "var(--c-input-bg)" }}>
          <span style={{ position: "absolute", top: 2, left: form.solicitud_piezas_activa === "true" ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="company_name">Nombre de la empresa</Label>
        <Input id="company_name" variant="dark" value={form.company_name} onChange={(v) => setForm((f) => ({ ...f, company_name: v }))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="company_tagline">Tagline</Label>
        <Input id="company_tagline" variant="dark" value={form.company_tagline} onChange={(v) => setForm((f) => ({ ...f, company_tagline: v }))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hero_title">Título del Hero</Label>
        <Input id="hero_title" variant="dark" value={form.hero_title} onChange={(v) => setForm((f) => ({ ...f, hero_title: v }))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hero_subtitle">Subtítulo del Hero</Label>
        <Input id="hero_subtitle" variant="dark" value={form.hero_subtitle} onChange={(v) => setForm((f) => ({ ...f, hero_subtitle: v }))} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="catalogo_nota_colores">Nota de colores (catálogo)</Label>
        <Textarea id="catalogo_nota_colores" variant="dark" rows={2}
          value={form.catalogo_nota_colores}
          onChange={(v) => setForm((f) => ({ ...f, catalogo_nota_colores: v }))} />
        <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
          Aparece bajo los colores en cada pieza. Ej: "¿No ves el color que buscas? Escríbenos y lo cotizamos."
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hero_description">Descripción del Hero</Label>
        <Textarea id="hero_description" variant="dark" rows={3} value={form.hero_description} onChange={(v) => setForm((f) => ({ ...f, hero_description: v }))} />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button text={saving ? "Guardando..." : "Guardar cambios"} onClick={save} disabled={saving} />
        {msg && <span className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</span>}
      </div>
    </Surface>
  );
}

// ── Services Tab ──────────────────────────────────────────────────────────────
const ICONS = ["code", "printer", "layout", "lightbulb", "globe", "database"].map((v) => ({ value: v, label: v }));
const CATEGORIES = ["software", "hardware", "design", "consulting", "general"].map((v) => ({ value: v, label: v }));

const EMPTY_SERVICE = { title: "", description: "", long_description: "", image_urls: [], icon: "code", category: "general", order_index: 0, is_active: true };

function ServicesTab() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_SERVICE);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(() => {
    apiFetch("/website/admin/services").then(setServices).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY_SERVICE); setModalOpen(true); }
  function openEdit(svc) {
    setEditing(svc);
    setForm({
      ...svc,
      long_description: svc.long_description ?? "",
      image_urls: svc.image_urls ?? [],
    });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        long_description: form.long_description || null,
        image_urls: form.image_urls?.length ? form.image_urls : null,
      };
      if (editing) {
        await apiFetch(`/website/admin/services/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/website/admin/services", { method: "POST", body: JSON.stringify(payload) });
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
    await apiFetch(`/website/admin/services/${id}`, { method: "DELETE" });
    setConfirmId(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg" style={{ color: "var(--c-text)" }}>Servicios</h2>
        <Button text="+ Agregar servicio" onClick={openCreate} />
      </div>

      <div className="grid gap-3">
        {services.map((svc) => (
          <Surface
            key={svc.id}
            className="p-4 flex items-start gap-4 cursor-pointer transition-all"
            onClick={() => navigate(`/app/website/services/${svc.slug || svc.id}`)}
            style={{ border: "1px solid var(--c-border)" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--c-border-hi)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--c-border)"}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: "var(--c-text)" }}>{svc.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${svc.is_active ? "bg-green-900/50 text-green-400" : ""}`}
                  style={!svc.is_active ? { background: "var(--c-hover)", color: "var(--c-text-3)" } : {}}>
                  {svc.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--c-text-2)" }}>{svc.description}</p>
              <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--c-text-4)" }}>
                <span>Icono: {svc.icon}</span>
                <span>Categoría: {svc.category}</span>
                <span>Orden: {svc.order_index}</span>
                {svc.slug && <span>/{svc.slug}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => openEdit(svc)} className="transition-colors text-sm px-3 py-1.5 rounded-lg" style={{ color: "var(--c-text-3)" }} onMouseEnter={e => { e.currentTarget.style.color = "var(--c-text)"; e.currentTarget.style.background = "var(--c-hover)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-3)"; e.currentTarget.style.background = "transparent"; }}>Editar rápido</button>
              <button onClick={() => setConfirmId(svc.id)} className="text-red-400/70 hover:text-red-400 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20">Eliminar</button>
            </div>
          </Surface>
        ))}
        {services.length === 0 && (
          <Surface className="p-8 text-center" style={{ color: "var(--c-text-4)" }}>No hay servicios. Agrega el primero.</Surface>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div className="p-5 space-y-4">
          <h3 className="font-semibold text-base" style={{ color: "var(--c-text)" }}>{editing ? "Editar servicio" : "Nuevo servicio"}</h3>

          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input variant="dark" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción corta</Label>
            <Textarea variant="dark" rows={2} value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción larga (página de detalle)</Label>
            <Textarea variant="dark" rows={4} value={form.long_description} onChange={(v) => setForm((f) => ({ ...f, long_description: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Imágenes</Label>
            <FileInput
              variant="dark"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.gif"
              size="sm"
              onChange={async (files) => {
                const uploaded = [];
                for (const file of files) {
                  const fd = new FormData();
                  fd.append("file", file);
                  const token = localStorage.getItem("viernes_token");
                  const res = await fetch(`${API}/images/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                  });
                  if (res.ok) {
                    const data = await res.json();
                    uploaded.push(`${API}${data.url}`);
                  }
                }
                if (uploaded.length) setForm((f) => ({ ...f, image_urls: [...(f.image_urls ?? []), ...uploaded] }));
              }}
            />
            {(form.image_urls ?? []).length > 0 && (
              <ul className="space-y-1 mt-1">
                {(form.image_urls ?? []).map((url, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs" style={{ border: "1px solid var(--c-border)", background: "var(--c-input-bg)", color: "var(--c-text-2)" }}>
                    <img src={url} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" onError={e => e.target.style.display="none"} />
                    <span className="flex-1 truncate">{url}</span>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, image_urls: f.image_urls.filter((_, j) => j !== i) }))}
                      className="shrink-0 transition" style={{ color: "var(--c-text-4)" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-4)"}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Icono</Label>
              <SearchSelect variant="dark" value={form.icon} onChange={(v) => setForm((f) => ({ ...f, icon: v }))} options={ICONS} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <SearchSelect variant="dark" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={CATEGORIES} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input variant="dark" type="number" value={String(form.order_index)} onChange={(v) => setForm((f) => ({ ...f, order_index: +v }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-cyan-400" />
              <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Activo</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" text="Cancelar" onClick={() => setModalOpen(false)} />
            <Button text={saving ? "Guardando..." : "Guardar"} onClick={save} disabled={saving} />
          </div>
        </div>
      </Modal>
      <ConfirmModal
        open={confirmId !== null}
        title="Eliminar servicio"
        description="¿Eliminar este servicio del website?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ── Contacts Tab ──────────────────────────────────────────────────────────────
const CONTACT_TYPES = [
  { value: "email", label: "Correo" },
  { value: "phone", label: "Teléfono" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "telegram", label: "Telegram" },
  { value: "other", label: "Otro" },
];
const AREAS = [
  { id: "software", label: "Software" },
  { id: "impresion3d", label: "Impresión 3D" },
];

const EMPTY_CONTACT = { contact_type: "email", label: "", value: "", is_active: true, areas: "software,impresion3d", es_red: false, es_contacto: true, orden: 0 };

function tieneArea(areas, id) { return (areas ?? "").split(",").includes(id); }

function toggleArea(areas, id) {
  const set = new Set((areas ?? "").split(",").filter(Boolean));
  set.has(id) ? set.delete(id) : set.add(id);
  return AREAS.filter((a) => set.has(a.id)).map((a) => a.id).join(",");
}

function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

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
    await apiFetch(`/website/admin/contacts/${id}`, { method: "DELETE" });
    setConfirmId(null);
    load();
  }

  const typeEmoji = {
    phone: "📞", email: "📧", whatsapp: "💬", other: "🔗",
    instagram: "📷", facebook: "👍", tiktok: "🎵", x: "✖️",
    youtube: "▶️", linkedin: "💼", telegram: "✈️",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg" style={{ color: "var(--c-text)" }}>Información de Contacto</h2>
        <Button text="+ Agregar contacto" onClick={openCreate} />
      </div>

      <div className="grid gap-3">
        {contacts.map((c) => (
          <Surface key={c.id} className="p-4 flex items-center gap-4">
            <span className="text-2xl">{typeEmoji[c.contact_type] ?? "🔗"}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold" style={{ color: "var(--c-text)" }}>{c.label}</div>
              <div className="text-sm" style={{ color: "var(--c-text-2)" }}>{c.value}</div>
            </div>
            <div className="flex gap-1">
              {c.es_contacto !== false && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,211,238,0.12)", color: "var(--c-accent)" }}>Contacto</span>
              )}
              {c.es_red && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>Red social</span>
              )}
            </div>
            <div className="flex gap-1">
              {AREAS.filter((a) => tieneArea(c.areas, a.id)).map((a) => (
                <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--c-hover)", color: "var(--c-text-3)" }}>{a.label}</span>
              ))}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-900/50 text-green-400" : ""}`}
              style={!c.is_active ? { background: "var(--c-hover)", color: "var(--c-text-3)" } : {}}>
              {c.is_active ? "Activo" : "Inactivo"}
            </span>
            <div className="flex gap-2">
              <button onClick={() => openEdit(c)} className="transition-colors text-sm px-3 py-1.5 rounded-lg" style={{ color: "var(--c-text-3)" }} onMouseEnter={e => { e.currentTarget.style.color = "var(--c-text)"; e.currentTarget.style.background = "var(--c-hover)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-3)"; e.currentTarget.style.background = "transparent"; }}>Editar</button>
              <button onClick={() => setConfirmId(c.id)} className="text-red-400/70 hover:text-red-400 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20">Eliminar</button>
            </div>
          </Surface>
        ))}
        {contacts.length === 0 && (
          <Surface className="p-8 text-center" style={{ color: "var(--c-text-4)" }}>No hay contactos.</Surface>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-5 space-y-4">
          <h3 className="font-semibold text-base" style={{ color: "var(--c-text)" }}>{editing ? "Editar contacto" : "Nuevo contacto"}</h3>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <SearchSelect variant="dark" value={form.contact_type} onChange={(v) => setForm((f) => ({ ...f, contact_type: v }))} options={CONTACT_TYPES} />
          </div>
          <div className="space-y-1.5">
            <Label>Etiqueta (ej: WhatsApp MX)</Label>
            <Input variant="dark" value={form.label} onChange={(v) => setForm((f) => ({ ...f, label: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor (número, email o URL)</Label>
            <Input variant="dark" value={form.value} onChange={(v) => setForm((f) => ({ ...f, value: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>¿Qué es?</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.es_contacto !== false}
                  onChange={(e) => setForm((f) => ({ ...f, es_contacto: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-400" />
                <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Dato de contacto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.es_red}
                  onChange={(e) => setForm((f) => ({ ...f, es_red: e.target.checked }))}
                  className="w-4 h-4 accent-green-400" />
                <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Red social</span>
              </label>
            </div>
            <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
              WhatsApp normalmente va con las dos marcadas.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Orden</Label>
            <Input variant="dark" type="number" value={String(form.orden ?? 0)}
              onChange={(v) => setForm((f) => ({ ...f, orden: parseInt(v) || 0 }))} />
          </div>

          <div className="space-y-1.5">
            <Label>¿Dónde se muestra?</Label>
            <div className="flex gap-4">
              {AREAS.map((a) => (
                <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={tieneArea(form.areas, a.id)}
                    onChange={() => setForm((f) => ({ ...f, areas: toggleArea(f.areas, a.id) }))}
                    className="w-4 h-4 accent-cyan-400" />
                  <span className="text-sm" style={{ color: "var(--c-text-2)" }}>{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-cyan-400" />
            <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Activo</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" text="Cancelar" onClick={() => setModalOpen(false)} />
            <Button text={saving ? "Guardando..." : "Guardar"} onClick={save} disabled={saving} />
          </div>
        </div>
      </Modal>
      <ConfirmModal
        open={confirmId !== null}
        title="Eliminar contacto"
        description="¿Eliminar este contacto del website?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
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
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(() => {
    apiFetch("/website/admin/members").then(setMembers).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY_MEMBER); setModalOpen(true); }
  function openEdit(m) {
    setEditing(m);
    setForm({ ...m, bio: m.bio ?? "", avatar_url: m.avatar_url ?? "", github_url: m.github_url ?? "", linkedin_url: m.linkedin_url ?? "" });
    setModalOpen(true);
  }

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
    await apiFetch(`/website/admin/members/${id}`, { method: "DELETE" });
    setConfirmId(null);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg" style={{ color: "var(--c-text)" }}>Equipo</h2>
        <Button text="+ Agregar miembro" onClick={openCreate} />
      </div>

      <div className="grid gap-3">
        {members.map((m) => (
          <Surface key={m.id} className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 overflow-hidden" style={{ background: "var(--c-hover)", color: "var(--c-text)" }}>
              {m.avatar_url ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" /> : m.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold" style={{ color: "var(--c-text)" }}>{m.name}</div>
              <div className="text-cyan-400 text-sm">{m.role}</div>
              {m.bio && <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--c-text-3)" }}>{m.bio}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(m)} className="transition-colors text-sm px-3 py-1.5 rounded-lg" style={{ color: "var(--c-text-3)" }} onMouseEnter={e => { e.currentTarget.style.color = "var(--c-text)"; e.currentTarget.style.background = "var(--c-hover)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-3)"; e.currentTarget.style.background = "transparent"; }}>Editar</button>
              <button onClick={() => setConfirmId(m.id)} className="text-red-400/70 hover:text-red-400 transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-red-900/20">Eliminar</button>
            </div>
          </Surface>
        ))}
        {members.length === 0 && (
          <Surface className="p-8 text-center" style={{ color: "var(--c-text-4)" }}>No hay miembros.</Surface>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <div className="p-5 space-y-4">
          <h3 className="font-semibold text-base" style={{ color: "var(--c-text)" }}>{editing ? "Editar miembro" : "Nuevo miembro"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input variant="dark" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Rol / Puesto</Label>
              <Input variant="dark" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea variant="dark" rows={2} value={form.bio} onChange={(v) => setForm((f) => ({ ...f, bio: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>URL de avatar</Label>
            <Input variant="dark" value={form.avatar_url} placeholder="https://..." onChange={(v) => setForm((f) => ({ ...f, avatar_url: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>GitHub URL</Label>
            <Input variant="dark" value={form.github_url} placeholder="https://github.com/..." onChange={(v) => setForm((f) => ({ ...f, github_url: v }))} />
          </div>
          <div className="space-y-1.5">
            <Label>LinkedIn URL</Label>
            <Input variant="dark" value={form.linkedin_url} placeholder="https://linkedin.com/in/..." onChange={(v) => setForm((f) => ({ ...f, linkedin_url: v }))} />
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label>Orden</Label>
              <Input variant="dark" type="number" value={String(form.order_index)} onChange={(v) => setForm((f) => ({ ...f, order_index: +v }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-cyan-400" />
              <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Activo</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" text="Cancelar" onClick={() => setModalOpen(false)} />
            <Button text={saving ? "Guardando..." : "Guardar"} onClick={save} disabled={saving} />
          </div>
        </div>
      </Modal>
      <ConfirmModal
        open={confirmId !== null}
        title="Eliminar miembro"
        description="¿Eliminar este miembro del equipo?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
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
        <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>Gestión del Website</h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-3)" }}>Administra el contenido público de tu sitio web.</p>
      </div>

      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--c-border)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px"
            style={activeTab === tab.id
              ? { color: "var(--c-accent)", borderColor: "var(--c-accent)" }
              : { color: "var(--c-text-3)", borderColor: "transparent" }
            }
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "var(--c-text-2)"; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = "var(--c-text-3)"; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>{tabContent[activeTab]}</div>
    </div>
  );
}
