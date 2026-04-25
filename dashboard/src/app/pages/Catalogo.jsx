import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { viernesApi } from "@/lib/apis/viernes";
import { ConfirmModal } from "@viernes/ui/react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ─── Íconos ───────────────────────────────────────────────────────────────────
const IconPlus  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconCheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconX     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ─── Tipos de material disponibles ───────────────────────────────────────────
const TIPOS_MATERIAL = ["PLA", "PLA+", "PETG", "ASA", "TPU", "ABS"];

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function Btn({ onClick, children, variant = "ghost", disabled, title }) {
  const base = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-40";
  const styles = { primary: { background: "var(--c-accent)", color: "#fff" }, ghost: { color: "var(--c-text-3)" }, danger: { color: "var(--c-text-3)" } };
  return (
    <button className={base} style={styles[variant]} onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={e => { if (disabled) return; if (variant === "primary") e.currentTarget.style.opacity = "0.85"; else if (variant === "danger") { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; } else { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "var(--c-text-2)"; } }}
      onMouseLeave={e => { if (disabled) return; e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = variant === "primary" ? "var(--c-accent)" : ""; e.currentTarget.style.color = styles[variant].color; }}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return <div className="flex flex-col gap-1"><label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>{label}</label>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="px-3 py-2 rounded-lg text-sm outline-none w-full" style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL DE FILAMENTO
// ═══════════════════════════════════════════════════════════════════════════════
const EMPTY_FIL = { nombre: "", tipo_material: "PLA", hex_codigo: "#000000", tarifa_por_minuto: "", en_stock: true, activo: true };

function FilamentoModal({ editing, form, setForm, onSave, onClose, saving, onAsignar, onDesasignar, bulkLoading }) {
  const isNew = editing === "new";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)" }}>

        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>
            {isNew ? "Nuevo filamento" : "Editar filamento"}
          </p>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--c-text-4)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "var(--c-text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--c-text-4)"; }}>
            <IconX />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre *">
            <Input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder='Ej: "PLA Negro"' />
          </Field>
          <Field label="Tipo de material *">
            <select value={form.tipo_material} onChange={e => setForm(p => ({ ...p, tipo_material: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
              onFocus={e => { e.target.style.borderColor = "var(--c-accent)"; }}
              onBlur={e => { e.target.style.borderColor = "var(--c-border-med)"; }}>
              {TIPOS_MATERIAL.map(t => <option key={t} value={t} style={{ background: "var(--c-shell)" }}>{t}</option>)}
            </select>
          </Field>
          <Field label="Color (hex) *">
            <div className="flex gap-2 items-center">
              <input type="color" value={form.hex_codigo} onChange={e => setForm(p => ({ ...p, hex_codigo: e.target.value }))}
                className="w-10 h-9 rounded cursor-pointer border-0 p-0.5" style={{ background: "var(--c-hover-2)" }} />
              <Input value={form.hex_codigo} onChange={e => setForm(p => ({ ...p, hex_codigo: e.target.value }))} placeholder="#000000" />
            </div>
          </Field>
          <Field label="Tarifa por minuto ($) *">
            <Input type="number" value={form.tarifa_por_minuto} onChange={e => setForm(p => ({ ...p, tarifa_por_minuto: e.target.value }))} placeholder="1.2" />
          </Field>
        </div>

        <div className="flex gap-5">
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--c-text-3)" }}>
            <input type="checkbox" checked={form.en_stock} onChange={e => setForm(p => ({ ...p, en_stock: e.target.checked }))} />
            En stock
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--c-text-3)" }}>
            <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
            Activo
          </label>
        </div>

        {/* Asignar / desasignar en todas las piezas (solo al editar) */}
        {!isNew && (
          <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>Piezas del catálogo</p>
            <div className="flex gap-2">
              <button onClick={onAsignar} disabled={bulkLoading}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
                onMouseEnter={e => { if (!bulkLoading) e.currentTarget.style.background = "rgba(34,197,94,0.22)"; }}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,0.12)"}>
                {bulkLoading === "asignar" ? "Asignando…" : "✓ Activar en todas las piezas"}
              </button>
              <button onClick={onDesasignar} disabled={bulkLoading}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" }}
                onMouseEnter={e => { if (!bulkLoading) e.currentTarget.style.background = "rgba(248,113,113,0.2)"; }}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}>
                {bulkLoading === "desasignar" ? "Quitando…" : "✕ Quitar de todas las piezas"}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Btn onClick={onClose}><IconX /> Cancelar</Btn>
          <Btn variant="primary" onClick={onSave} disabled={saving}><IconCheck /> {saving ? "Guardando…" : "Guardar"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: FILAMENTOS
// ═══════════════════════════════════════════════════════════════════════════════
function TabFilamentos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(null); // "asignar" | "desasignar" | null
  const [editing, setEditing] = useState(null);         // null | "new" | id
  const [form, setForm] = useState(EMPTY_FIL);
  const [expanded, setExpanded] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(null); // "asignar" | "desasignar" | null

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await viernesApi.listFilamentos()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function startNew() { setForm(EMPTY_FIL); setEditing("new"); }
  function startEdit(item) {
    setForm({ nombre: item.nombre, tipo_material: item.tipo_material, hex_codigo: item.hex_codigo, tarifa_por_minuto: String(item.tarifa_por_minuto), en_stock: item.en_stock, activo: item.activo });
    setEditing(item.id);
  }
  function closeModal() { setEditing(null); setForm(EMPTY_FIL); }

  async function save() {
    if (!form.nombre.trim() || !form.tarifa_por_minuto) return;
    setSaving(true);
    try {
      const payload = { ...form, tarifa_por_minuto: parseFloat(form.tarifa_por_minuto) };
      if (editing === "new") await viernesApi.createFilamento(payload);
      else await viernesApi.updateFilamento(editing, payload);
      closeModal(); await load();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  }

  async function del(id) {
    try { await viernesApi.deleteFilamento(id); setItems(p => p.filter(i => i.id !== id)); }
    catch (e) { alert("Error: " + e.message); }
    finally { setConfirmDel(null); }
  }

  async function handleAsignar() {
    setConfirmBulk(null);
    setBulkLoading("asignar");
    try { const r = await viernesApi.asignarFilamentoTodos(editing); alert(`Filamento asignado a ${r.asignados} producto(s).`); }
    catch (e) { alert("Error: " + e.message); }
    finally { setBulkLoading(null); }
  }

  async function handleDesasignar() {
    setConfirmBulk(null);
    setBulkLoading("desasignar");
    try { const r = await viernesApi.desasignarFilamentoTodos(editing); alert(`Filamento eliminado de ${r.eliminados} producto(s).`); }
    catch (e) { alert("Error: " + e.message); }
    finally { setBulkLoading(null); }
  }

  const grupos = items.reduce((acc, item) => {
    if (!acc[item.tipo_material]) acc[item.tipo_material] = [];
    acc[item.tipo_material].push(item);
    return acc;
  }, {});

  function toggleGrupo(tipo) {
    setExpanded(p => ({ ...p, [tipo]: !p[tipo] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
          Material + color con su tarifa. Activa el stock para que aparezca en el website.
        </p>
        <Btn variant="primary" onClick={startNew}><IconPlus /> Agregar</Btn>
      </div>

      {loading ? (
        <p className="text-sm py-4 text-center" style={{ color: "var(--c-text-4)" }}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: "var(--c-text-4)" }}>Sin filamentos aún.</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grupos).map(([tipo, grupo]) => {
            const isOpen = !!expanded[tipo];
            const enStock = grupo.filter(f => f.en_stock).length;
            return (
              <div key={tipo} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border-med)" }}>
                {/* Header colapsable */}
                <button onClick={() => toggleGrupo(tipo)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ background: "var(--c-hover)" }}>
                  <span className="text-xs font-bold uppercase tracking-widest flex-1" style={{ color: "var(--c-text-2)" }}>{tipo}</span>
                  <span className="text-[10px]" style={{ color: "var(--c-text-4)" }}>{grupo.length} colores</span>
                  {enStock > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>
                      {enStock} en stock
                    </span>
                  )}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ color: "var(--c-text-4)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Filas */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--c-border-med)" }}>
                    {grupo.map((item, i) => (
                      <div key={item.id} className="grid items-center gap-3 px-4 py-2.5"
                        style={{ gridTemplateColumns: "auto 1fr auto auto auto", borderBottom: i < grupo.length - 1 ? "1px solid var(--c-border)" : "none" }}>
                        <div className="w-5 h-5 rounded-md flex-shrink-0" style={{ background: item.hex_codigo, border: "1px solid var(--c-border-med)" }} />
                        <span className="text-sm truncate" style={{ color: "var(--c-text)" }}>{item.nombre}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={item.en_stock ? { background: "rgba(34,197,94,0.12)", color: "#4ade80" } : { background: "rgba(248,113,113,0.12)", color: "#f87171" }}>
                          {item.en_stock ? "En stock" : "Sin stock"}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={item.activo ? { background: "rgba(34,197,94,0.12)", color: "#4ade80" } : { background: "var(--c-hover-2)", color: "var(--c-text-4)" }}>
                          {item.activo ? "Activo" : "Inactivo"}
                        </span>
                        <div className="flex gap-1">
                          <Btn onClick={() => startEdit(item)}><IconEdit /></Btn>
                          <Btn variant="danger" onClick={() => setConfirmDel(item.id)}><IconTrash /></Btn>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {editing !== null && (
        <FilamentoModal
          editing={editing} form={form} setForm={setForm}
          onSave={save} onClose={closeModal} saving={saving}
          onAsignar={() => setConfirmBulk("asignar")} onDesasignar={() => setConfirmBulk("desasignar")}
          bulkLoading={bulkLoading}
        />
      )}
      <ConfirmModal
        open={confirmDel !== null}
        title="Eliminar filamento"
        description="¿Eliminar este filamento del catálogo?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => del(confirmDel)}
        onCancel={() => setConfirmDel(null)}
      />
      <ConfirmModal
        open={confirmBulk === "asignar"}
        title="Asignar a todos los productos"
        description="¿Agregar este filamento a TODOS los productos del catálogo?"
        confirmText="Asignar"
        variant="default"
        onConfirm={handleAsignar}
        onCancel={() => setConfirmBulk(null)}
      />
      <ConfirmModal
        open={confirmBulk === "desasignar"}
        title="Quitar de todos los productos"
        description="¿Quitar este filamento de TODOS los productos? Esto lo eliminará del catálogo de cada pieza."
        confirmText="Quitar"
        variant="danger"
        onConfirm={handleDesasignar}
        onCancel={() => setConfirmBulk(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PRODUCTOS
// ═══════════════════════════════════════════════════════════════════════════════
function TabProductos() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setItems(await viernesApi.listProductosCatalogo()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function del(id) {
    setDeleting(id);
    try { await viernesApi.deleteProductoCatalogo(id); setItems(p => p.filter(i => i.id !== id)); }
    catch (err) { alert("Error: " + err.message); }
    finally { setDeleting(null); setConfirmId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--c-text-4)" }}>Productos visibles en el catálogo del website.</p>
        <Btn variant="primary" onClick={() => navigate("/app/catalogo/nuevo")}><IconPlus /> Nuevo producto</Btn>
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--c-text-4)" }}>Cargando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-14 gap-3"
          style={{ borderColor: "var(--c-border-med)", color: "var(--c-text-4)" }}>
          <p className="text-sm font-medium">Sin productos en el catálogo</p>
          <Btn variant="primary" onClick={() => navigate("/app/catalogo/nuevo")}><IconPlus /> Crear primero</Btn>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border-med)" }}>
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ background: "var(--c-hover)", borderBottom: "1px solid var(--c-border)", color: "var(--c-text-4)" }}>
            <span>Preview</span><span>Nombre</span><span className="text-right">Tiempo base</span><span className="text-right">Tamaños</span><span>Estado</span><span></span>
          </div>
          {items.map((item, i) => (
            <div key={item.id} onClick={() => navigate(`/app/catalogo/${item.id}`)}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center cursor-pointer transition-colors"
              style={{ borderBottom: i < items.length - 1 ? "1px solid var(--c-border)" : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{ background: "var(--c-hover-2)", border: "1px solid var(--c-border)" }}>
                {item.foto_preview_url
                  ? <img src={`${API_BASE}${item.foto_preview_url}`} className="w-full h-full object-cover" alt="" />
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ color: "var(--c-text-4)" }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                }
              </div>
              <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{item.nombre}</p>
              <span className="text-xs font-mono text-right" style={{ color: "var(--c-text-3)" }}>{item.tiempo_impresion_minutos} min</span>
              <span className="text-xs text-right" style={{ color: "var(--c-text-4)" }}>{item.tamano_minimo_mm}–{item.tamano_maximo_mm} mm</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={item.publicado ? { background: "rgba(34,197,94,0.12)", color: "#4ade80" } : { background: "var(--c-hover-2)", color: "var(--c-text-4)" }}>
                {item.publicado ? "Publicado" : "Borrador"}
              </span>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <Btn onClick={() => navigate(`/app/catalogo/${item.id}`)}><IconEdit /></Btn>
                <Btn variant="danger" onClick={() => setConfirmId(item.id)} disabled={deleting === item.id}><IconTrash /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Eliminar producto"
        description="¿Eliminar este producto del catálogo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => del(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "productos",  label: "Productos" },
  { id: "filamentos", label: "Filamentos" },
];

export default function Catalogo() {
  const [tab, setTab] = useState("productos");

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>Catálogo 3D</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-4)" }}>Administra productos y filamentos del catálogo público</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--c-hover)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={tab === t.id
              ? { background: "var(--c-shell)", color: "var(--c-text)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }
              : { color: "var(--c-text-3)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)" }}>
        {tab === "productos"  && <TabProductos />}
        {tab === "filamentos" && <TabFilamentos />}
      </div>
    </div>
  );
}
