import { useState, useEffect } from "react";
import { viernesApi } from "@/lib/apis/viernes";

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { value: "filamento",    label: "Filamento",    color: "#a78bfa" },
  { value: "boquilla",     label: "Boquilla",     color: "#60a5fa" },
  { value: "herramienta",  label: "Herramienta",  color: "#f59e0b" },
  { value: "quimico",      label: "Químico",      color: "#34d399" },
  { value: "otro",         label: "Otro",         color: "#94a3b8" },
];
const TIPOS = [
  { value: "consumible",     label: "Consumible"     },
  { value: "no_consumible",  label: "No consumible"  },
];
const UNIDADES = ["kg", "g", "piezas", "m", "l", "otro"];

const CAT_MAP = Object.fromEntries(CATEGORIAS.map(c => [c.value, c]));

const fmt$ = (n) =>
  (n ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });
const fmtN = (n, u) => `${(n ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${u ?? ""}`;

const EMPTY_ITEM = { nombre: "", categoria: "filamento", tipo: "consumible", unidad: "kg", cantidad_actual: "", cantidad_minima: "", precio_referencia: "", notas: "", activo: true };
const EMPTY_COMPRA = { item_id: "", cantidad: "", precio_total: "", fecha: new Date().toISOString().slice(0, 10), proveedor: "", notas: "" };

// ─── UI helpers ───────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder, type = "text", disabled }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="px-3 py-2 rounded-lg text-sm outline-none w-full disabled:opacity-50"
      style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
      onFocus={e => { e.target.style.borderColor = "var(--c-accent)"; }}
      onBlur={e => { e.target.style.borderColor = "var(--c-border-med)"; }}
    />
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="px-3 py-2 rounded-lg text-sm outline-none w-full"
      style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
      onFocus={e => { e.target.style.borderColor = "var(--c-accent)"; }}
      onBlur={e => { e.target.style.borderColor = "var(--c-border-med)"; }}>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o} style={{ background: "var(--c-shell)" }}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}
function CategoriaBadge({ cat }) {
  const meta = CAT_MAP[cat] ?? { label: cat, color: "#94a3b8" };
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: meta.color + "22", color: meta.color }}>
      {meta.label}
    </span>
  );
}
function SummaryCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl p-5 space-y-1" style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)" }}>
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent ?? "var(--c-text)" }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: "var(--c-text-4)" }}>{sub}</p>}
    </div>
  );
}

// ─── Tab: Inventario ──────────────────────────────────────────────────────────
function TabItems({ items, loading, onRefresh }) {
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);

  function startNew() { setForm(EMPTY_ITEM); setEditing("new"); }
  function startEdit(item) {
    setForm({
      nombre: item.nombre, categoria: item.categoria, tipo: item.tipo, unidad: item.unidad,
      cantidad_actual: String(item.cantidad_actual), cantidad_minima: String(item.cantidad_minima),
      precio_referencia: item.precio_referencia != null ? String(item.precio_referencia) : "",
      notas: item.notas ?? "", activo: item.activo,
    });
    setEditing(item.id);
  }
  function cancel() { setEditing(null); }

  async function save() {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        cantidad_actual: parseFloat(form.cantidad_actual) || 0,
        cantidad_minima: parseFloat(form.cantidad_minima) || 0,
        precio_referencia: form.precio_referencia !== "" ? parseFloat(form.precio_referencia) : null,
      };
      if (editing === "new") await viernesApi.createInventarioItem(payload);
      else await viernesApi.updateInventarioItem(editing, payload);
      setEditing(null);
      onRefresh();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm("¿Eliminar este item? Se eliminarán también sus compras registradas.")) return;
    try { await viernesApi.deleteInventarioItem(id); onRefresh(); }
    catch (e) { alert("Error: " + e.message); }
  }

  // Agrupar por categoría
  const grupos = items.reduce((acc, it) => {
    if (!acc[it.categoria]) acc[it.categoria] = [];
    acc[it.categoria].push(it);
    return acc;
  }, {});

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
          Cada item es un material o herramienta única. Las compras suman al stock automáticamente.
        </p>
        {editing !== "new" && (
          <button onClick={startNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--c-accent)", color: "#fff" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar
          </button>
        )}
      </div>

      {/* Formulario */}
      {editing !== null && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>
            {editing === "new" ? "Nuevo item" : "Editar item"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre *">
              <Input value={form.nombre} onChange={f("nombre")} placeholder='Ej: PLA Negro 1kg, Boquilla 0.4mm' />
            </Field>
            <Field label="Categoría *">
              <Select value={form.categoria} onChange={v => setForm(p => ({ ...p, categoria: v }))} options={CATEGORIAS} />
            </Field>
            <Field label="Tipo *">
              <Select value={form.tipo} onChange={v => setForm(p => ({ ...p, tipo: v }))} options={TIPOS} />
            </Field>
            <Field label="Unidad *">
              <Select value={form.unidad} onChange={v => setForm(p => ({ ...p, unidad: v }))} options={UNIDADES.map(u => ({ value: u, label: u }))} />
            </Field>
            <Field label="Stock actual">
              <Input type="number" value={form.cantidad_actual} onChange={f("cantidad_actual")} placeholder="0" />
            </Field>
            <Field label="Stock mínimo (alerta)">
              <Input type="number" value={form.cantidad_minima} onChange={f("cantidad_minima")} placeholder="0" />
            </Field>
            <Field label="Precio referencia por unidad ($)">
              <Input type="number" value={form.precio_referencia} onChange={f("precio_referencia")} placeholder="0.00" />
            </Field>
            <Field label="Notas">
              <Input value={form.notas} onChange={f("notas")} placeholder="Opcional" />
            </Field>
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--c-text-3)" }}>
              <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
              Activo
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancel} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Cancelar</button>
            <button onClick={save} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <p className="text-sm py-6 text-center" style={{ color: "var(--c-text-4)" }}>Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--c-text-4)" }}>Sin items. Agrega el primero.</p>
      ) : (
        <div className="space-y-4">
          {CATEGORIAS.filter(c => grupos[c.value]).map(cat => (
            <div key={cat.value}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: "var(--c-text-4)" }}>
                {cat.label}
              </p>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border-med)" }}>
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ background: "var(--c-hover)", borderBottom: "1px solid var(--c-border)", color: "var(--c-text-4)" }}>
                  <span>Nombre</span><span>Tipo</span><span className="text-right">Stock</span>
                  <span className="text-right">Mínimo</span><span className="text-right">$/u</span><span></span>
                </div>
                {(grupos[cat.value] ?? []).map((it, i, arr) => {
                  const bajo = it.tipo === "consumible" && it.cantidad_actual <= it.cantidad_minima;
                  return (
                    <div key={it.id}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-3 items-center"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--c-border)" : "none", opacity: it.activo ? 1 : 0.5 }}>
                      <div className="flex items-center gap-2 min-w-0">
                        {bajo && (
                          <span title="Stock bajo" className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#f87171" }} />
                        )}
                        <span className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{it.nombre}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={it.tipo === "consumible"
                          ? { background: "rgba(167,139,250,0.12)", color: "#a78bfa" }
                          : { background: "var(--c-hover-2)", color: "var(--c-text-4)" }}>
                        {it.tipo === "consumible" ? "Consumible" : "No cons."}
                      </span>
                      <span className="text-sm font-mono text-right font-semibold"
                        style={{ color: bajo ? "#f87171" : "var(--c-text)" }}>
                        {fmtN(it.cantidad_actual, it.unidad)}
                      </span>
                      <span className="text-xs text-right" style={{ color: "var(--c-text-4)" }}>
                        {it.cantidad_minima > 0 ? fmtN(it.cantidad_minima, it.unidad) : "—"}
                      </span>
                      <span className="text-xs text-right font-mono" style={{ color: "var(--c-accent)" }}>
                        {it.precio_referencia != null ? fmt$(it.precio_referencia) : "—"}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(it)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-4)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--c-hover-2)"; e.currentTarget.style.color = "var(--c-text)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--c-text-4)"; }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => del(it.id)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-4)" }}
                          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-4)"; }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Compras ─────────────────────────────────────────────────────────────
function TabCompras({ items, onRefresh }) {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_COMPRA);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCompras(); }, []);

  async function loadCompras() {
    setLoading(true);
    try { setCompras(await viernesApi.listInventarioCompras()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function save() {
    if (!form.item_id || !form.cantidad || !form.precio_total || !form.fecha) return;
    setSaving(true);
    try {
      await viernesApi.createInventarioCompra({
        item_id: parseInt(form.item_id),
        cantidad: parseFloat(form.cantidad),
        precio_total: parseFloat(form.precio_total),
        fecha: form.fecha,
        proveedor: form.proveedor || null,
        notas: form.notas || null,
      });
      setForm(EMPTY_COMPRA);
      setShowForm(false);
      loadCompras();
      onRefresh();
    } catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm("¿Eliminar esta compra? El stock del item se reducirá.")) return;
    try { await viernesApi.deleteInventarioCompra(id); loadCompras(); onRefresh(); }
    catch (e) { alert("Error: " + e.message); }
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
          Cada compra suma automáticamente al stock del item.
        </p>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--c-accent)", color: "#fff" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Registrar compra
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Nueva compra</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item *">
              <Select value={form.item_id} onChange={v => setForm(p => ({ ...p, item_id: v }))}
                options={[{ value: "", label: "Seleccionar…" }, ...items.map(it => ({ value: String(it.id), label: `${it.nombre} (${it.unidad})` }))]} />
            </Field>
            <Field label="Fecha *">
              <Input type="date" value={form.fecha} onChange={f("fecha")} />
            </Field>
            <Field label={`Cantidad (${items.find(i => String(i.id) === String(form.item_id))?.unidad ?? "unidades"}) *`}>
              <Input type="number" value={form.cantidad} onChange={f("cantidad")} placeholder="0" />
            </Field>
            <Field label="Precio total ($) *">
              <Input type="number" value={form.precio_total} onChange={f("precio_total")} placeholder="0.00" />
            </Field>
            <Field label="Proveedor">
              <Input value={form.proveedor} onChange={f("proveedor")} placeholder="Ej: Amazon, mercado local…" />
            </Field>
            <Field label="Nota">
              <Input value={form.notas} onChange={f("notas")} placeholder="Opcional" />
            </Field>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--c-text-3)" }}>Cancelar</button>
            <button onClick={save} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              {saving ? "Guardando…" : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm py-6 text-center" style={{ color: "var(--c-text-4)" }}>Cargando…</p>
      ) : compras.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--c-text-4)" }}>Sin compras registradas.</p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border-med)" }}>
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ background: "var(--c-hover)", borderBottom: "1px solid var(--c-border)", color: "var(--c-text-4)" }}>
            <span>Fecha</span><span>Item</span><span className="text-right">Cantidad</span>
            <span className="text-right">Total</span><span>Proveedor</span><span></span>
          </div>
          {compras.map((c, i) => (
            <div key={c.id} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-3 items-center"
              style={{ borderBottom: i < compras.length - 1 ? "1px solid var(--c-border)" : "none" }}>
              <span className="text-xs font-mono" style={{ color: "var(--c-text-4)" }}>{c.fecha}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{c.item_nombre}</p>
                {c.notas && <p className="text-xs truncate" style={{ color: "var(--c-text-4)" }}>{c.notas}</p>}
              </div>
              <span className="text-sm text-right font-mono" style={{ color: "var(--c-text-2)" }}>
                {fmtN(c.cantidad, c.item_unidad)}
              </span>
              <span className="text-sm text-right font-semibold font-mono" style={{ color: "var(--c-accent)" }}>
                {fmt$(c.precio_total)}
              </span>
              <span className="text-xs" style={{ color: "var(--c-text-4)" }}>{c.proveedor ?? "—"}</span>
              <button onClick={() => del(c.id)} className="p-1.5 rounded-lg transition-all" style={{ color: "var(--c-text-4)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-4)"; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Resumen ─────────────────────────────────────────────────────────────
function TabResumen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    viernesApi.getInventarioResumen()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: "var(--c-text-4)" }}>Calculando…</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard label="Total gastado" value={fmt$(data.total_gastado)} sub="Todas las compras" accent="#f87171" />
        <SummaryCard label="Gastado en filamento" value={fmt$(data.total_filamento)} sub="Solo filamento" accent="#a78bfa" />
        <SummaryCard label="Total ganado" value={fmt$(data.total_ganado)} sub="Suma de piezas cobradas" accent="#4ade80" />
        <SummaryCard
          label="Balance neto"
          value={fmt$(data.balance)}
          sub={data.balance >= 0 ? "Ganancia" : "Pérdida"}
          accent={data.balance >= 0 ? "#4ade80" : "#f87171"}
        />
      </div>

      {/* Alertas */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-4)" }}>
          Alertas de stock bajo
        </p>
        {data.alertas.length === 0 ? (
          <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <span style={{ color: "#4ade80" }}>✓</span>
            <span className="text-sm" style={{ color: "#4ade80" }}>Todo el inventario está bien abastecido.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {data.alertas.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#f87171" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--c-text)" }}>{a.nombre}</p>
                  <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
                    Stock actual: <strong style={{ color: "#f87171" }}>{fmtN(a.cantidad_actual, a.unidad)}</strong>
                    {" "}· Mínimo: {fmtN(a.cantidad_minima, a.unidad)}
                  </p>
                </div>
                <CategoriaBadge cat={a.categoria} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
const TABS = [
  { id: "items",    label: "Inventario" },
  { id: "compras",  label: "Compras"    },
  { id: "resumen",  label: "Resumen"    },
];

export default function Inventario() {
  const [tab, setTab] = useState("items");
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  async function loadItems() {
    setLoadingItems(true);
    try { setItems(await viernesApi.listInventarioItems()); }
    catch (e) { console.error(e); }
    finally { setLoadingItems(false); }
  }

  useEffect(() => { loadItems(); }, []);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>Inventario</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-4)" }}>
          Control de materiales, herramientas y gastos
        </p>
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
        {tab === "items"   && <TabItems items={items} loading={loadingItems} onRefresh={loadItems} />}
        {tab === "compras" && <TabCompras items={items} onRefresh={loadItems} />}
        {tab === "resumen" && <TabResumen />}
      </div>
    </div>
  );
}
