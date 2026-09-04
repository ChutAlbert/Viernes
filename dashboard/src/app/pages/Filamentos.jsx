import { useState, useEffect, useMemo } from "react";
import { viernesApi } from "../../lib/apis/viernes";
import Select from "@components/Select";

const TIPOS = ["PLA", "PLA+", "PLA Silk", "PETG", "ABS", "ASA", "TPU", "Resina"].map((t) => ({ value: t, label: t }));
const UNIDADES = ["kg", "g", "m", "piezas"].map((u) => ({ value: u, label: u }));

const blank = () => ({
  _new: true, nombre: "", tipo_material: "PLA", hex_codigo: "#1a1a1a", tarifa_por_minuto: 0.6,
  en_stock: true, activo: true, cantidad_actual: 0, cantidad_minima: 0, unidad: "kg", precio_referencia: "",
});

// Quita el prefijo del tipo: "PLA Azul Cielo" -> "Azul Cielo"
const corto = (nombre, tipo) => (nombre?.startsWith(tipo + " ") ? nombre.slice(tipo.length + 1) : nombre);
const bajo = (r) => parseFloat(r.cantidad_minima) > 0 && parseFloat(r.cantidad_actual) <= parseFloat(r.cantidad_minima);
const rowKey = (r) => (r._new ? r._tmp : r.id);

export default function Filamentos() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    viernesApi.listFilamentos().then((d) => setRows(d.map((f) => ({ ...f })))).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setRow = (key, patch) => setRows((rs) => rs.map((r) => (rowKey(r) === key ? { ...r, ...patch } : r)));

  const addRow = () => {
    const r = { ...blank(), _tmp: "new-" + Date.now() };
    setRows((rs) => [r, ...rs]);
    setOpenId(r._tmp);
  };

  const save = async (key) => {
    const r = rows.find((x) => rowKey(x) === key);
    if (!r || !r.nombre.trim()) return;
    setSavingId(key);
    const payload = {
      nombre: r.nombre.trim(), tipo_material: r.tipo_material, hex_codigo: r.hex_codigo,
      tarifa_por_minuto: parseFloat(r.tarifa_por_minuto) || 0, en_stock: !!r.en_stock, activo: r.activo !== false,
      cantidad_actual: parseFloat(r.cantidad_actual) || 0, cantidad_minima: parseFloat(r.cantidad_minima) || 0,
      unidad: r.unidad || "kg",
      precio_referencia: r.precio_referencia === "" || r.precio_referencia == null ? null : parseFloat(r.precio_referencia),
    };
    try {
      const saved = r._new ? await viernesApi.createFilamento(payload) : await viernesApi.updateFilamento(r.id, payload);
      setRows((rs) => rs.map((x) => (rowKey(x) === key ? { ...saved } : x)));
      setOpenId(null);
    } catch {/* silencioso */} finally { setSavingId(null); }
  };

  const del = async (key) => {
    const r = rows.find((x) => rowKey(x) === key);
    if (!r) return;
    if (r._new) { setRows((rs) => rs.filter((x) => rowKey(x) !== key)); return; }
    if (!window.confirm("¿Eliminar \"" + r.nombre + "\"?")) return;
    try { await viernesApi.deleteFilamento(r.id); setRows((rs) => rs.filter((x) => rowKey(x) !== key)); } catch {}
  };

  // Filtro + agrupado por tipo
  const term = q.trim().toLowerCase();
  const grupos = useMemo(() => {
    const filtradas = term
      ? rows.filter((r) => (r.nombre || "").toLowerCase().includes(term) || (r.tipo_material || "").toLowerCase().includes(term))
      : rows;
    const g = {};
    for (const r of filtradas) (g[r.tipo_material] ||= []).push(r);
    return g;
  }, [rows, term]);

  const totalBajos = rows.filter(bajo).length;

  return (
    <div style={{ width: "100%", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--c-text)" }}>Filamentos</h1>
          <p style={{ fontSize: 13, color: "var(--c-text-3)", margin: "4px 0 0" }}>
            {rows.length} filamentos
            {totalBajos > 0 && <span style={{ color: "#f59e0b", fontWeight: 600 }}> · {totalBajos} con stock bajo</span>}
          </p>
        </div>
        <button onClick={addRow} style={S.primary}>+ Nuevo filamento</button>
      </div>

      <style>{`details > summary::-webkit-details-marker{display:none} details[open] .det-arrow{transform:rotate(90deg)}`}</style>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o tipo…"
        style={{ ...S.input, marginBottom: 14 }} />

      {loading ? <p style={{ color: "var(--c-text-3)", fontSize: 14 }}>Cargando…</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.keys(grupos).length === 0 && <p style={{ color: "var(--c-text-4)", fontSize: 14 }}>Sin resultados.</p>}
          {Object.entries(grupos).map(([tipo, items]) => {
            // ponytail: <details> nativo en vez de estado de accordion. Cerrado por defecto;
            // la key lo remonta abierto cuando hay búsqueda o una fila en edición dentro del grupo.
            const forzar = !!term || items.some((r) => rowKey(r) === openId);
            return (
            <details key={tipo + (forzar ? "-o" : "")} open={forzar}
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12 }}>
              <summary style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer", listStyle: "none",
                                fontSize: 11, fontWeight: 700, color: "var(--c-text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <svg className="det-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                  style={{ color: "var(--c-text-4)", flexShrink: 0, transition: "transform .15s" }}>
                  <polyline points="9 6 15 12 9 18"/>
                </svg>
                {tipo} <span style={{ color: "var(--c-text-4)", fontWeight: 500 }}>({items.length})</span>
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2" style={{ padding: "0 12px 12px", alignItems: "start" }}>
                {items.map((r) => {
                  const key = rowKey(r);
                  const open = openId === key;
                  return (
                    <div key={key} style={{ border: "1px solid var(--c-border)", borderRadius: 10, overflow: "hidden",
                                            gridColumn: open ? "1 / -1" : "auto" }}>
                      {/* Fila compacta */}
                      <div onClick={() => setOpenId(open ? null : key)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer",
                                 background: open ? "var(--c-hover)" : "transparent" }}>
                        <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: r.hex_codigo || "#888", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.25)" }} />
                        <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--c-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r._new ? (r.nombre || "Nuevo filamento") : corto(r.nombre, tipo)}
                        </span>
                        {bajo(r) && <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", flexShrink: 0 }}>STOCK BAJO</span>}
                        <span style={{ fontSize: 12, color: "var(--c-text-3)", width: 82, textAlign: "right", flexShrink: 0 }}>
                          {parseFloat(r.cantidad_actual) || 0} {r.unidad || "kg"}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--c-text-4)", width: 66, textAlign: "right", flexShrink: 0 }}>${r.tarifa_por_minuto}/min</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                          style={{ color: "var(--c-text-4)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none" }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>

                      {/* Edición */}
                      {open && (
                        <div style={{ padding: "4px 12px 14px", borderTop: "1px solid var(--c-border)" }}>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" style={{ alignItems: "end", marginTop: 10 }}>
                            <div style={S.field}><span style={S.lbl}>Nombre</span>
                              <input value={r.nombre} onChange={(e) => setRow(key, { nombre: e.target.value })} style={S.input} placeholder="PLA Negro" /></div>
                            <div style={S.field}><span style={S.lbl}>Tipo</span>
                              <Select value={r.tipo_material} onChange={(v) => setRow(key, { tipo_material: v })} options={TIPOS} /></div>
                            <div style={S.field}><span style={S.lbl}>Color</span>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input type="color" value={r.hex_codigo} onChange={(e) => setRow(key, { hex_codigo: e.target.value })}
                                  style={{ width: 34, height: 34, border: "1px solid var(--c-border-med)", borderRadius: 8, background: "transparent", padding: 0, cursor: "pointer", flexShrink: 0 }} />
                                <input value={r.hex_codigo} onChange={(e) => setRow(key, { hex_codigo: e.target.value })} style={{ ...S.input, flex: 1, minWidth: 0 }} />
                              </div></div>
                            <div style={S.field}><span style={S.lbl}>$/min</span>
                              <input type="number" step={0.05} value={r.tarifa_por_minuto} onChange={(e) => setRow(key, { tarifa_por_minuto: e.target.value })} style={S.input} /></div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" style={{ alignItems: "end", marginTop: 10 }}>
                            <div style={S.field}><span style={S.lbl}>Stock</span>
                              <input type="number" step={0.1} value={r.cantidad_actual ?? 0} onChange={(e) => setRow(key, { cantidad_actual: e.target.value })} style={S.input} /></div>
                            <div style={S.field}><span style={S.lbl}>Mínimo</span>
                              <input type="number" step={0.1} value={r.cantidad_minima ?? 0} onChange={(e) => setRow(key, { cantidad_minima: e.target.value })} style={S.input} /></div>
                            <div style={S.field}><span style={S.lbl}>Unidad</span>
                              <Select value={r.unidad || "kg"} onChange={(v) => setRow(key, { unidad: v })} options={UNIDADES} /></div>
                            <div style={S.field}><span style={S.lbl}>Precio ref. ($)</span>
                              <input type="number" step={1} value={r.precio_referencia ?? ""} onChange={(e) => setRow(key, { precio_referencia: e.target.value })} style={S.input} /></div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--c-text-2)", cursor: "pointer" }}>
                              <input type="checkbox" checked={r.activo !== false} onChange={(e) => setRow(key, { activo: e.target.checked })} /> Mostrar en el sitio
                            </label>
                            <div style={{ flex: 1 }} />
                            <button onClick={() => del(key)} style={S.ghost}>Eliminar</button>
                            <button onClick={() => save(key)} disabled={savingId === key || !r.nombre.trim()} style={S.primary}>
                              {savingId === key ? "Guardando…" : r._new ? "Crear" : "Guardar"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  field: { display: "flex", flexDirection: "column", gap: 4 },
  lbl: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: { padding: "8px 11px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  primary: { fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--c-accent)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" },
  ghost: { fontSize: 13, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
};
