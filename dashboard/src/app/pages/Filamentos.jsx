import { useState, useEffect } from "react";
import { viernesApi } from "../../lib/apis/viernes";
import Select from "@components/Select";

const TIPOS = ["PLA", "PLA+", "PETG", "ABS", "ASA", "TPU", "Resina"].map((t) => ({ value: t, label: t }));

const blank = () => ({ _new: true, nombre: "", tipo_material: "PLA", hex_codigo: "#1a1a1a", tarifa_por_minuto: 0.6, en_stock: true, activo: true });

export default function Filamentos() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = () => {
    setLoading(true);
    viernesApi.listFilamentos().then((d) => setRows(d.map((f) => ({ ...f })))).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch, _dirty: true } : r)));
  const addRow = () => setRows((rs) => [...rs, blank()]);

  const save = async (i) => {
    const r = rows[i];
    if (!r.nombre.trim()) return;
    setSavingId(i);
    const payload = { nombre: r.nombre.trim(), tipo_material: r.tipo_material, hex_codigo: r.hex_codigo, tarifa_por_minuto: parseFloat(r.tarifa_por_minuto) || 0, en_stock: !!r.en_stock, activo: r.activo !== false };
    try {
      const saved = r._new ? await viernesApi.createFilamento(payload) : await viernesApi.updateFilamento(r.id, payload);
      setRows((rs) => rs.map((x, j) => (j === i ? { ...saved } : x)));
    } catch {/* silencioso */} finally { setSavingId(null); }
  };

  const del = async (i) => {
    const r = rows[i];
    if (r._new) { setRows((rs) => rs.filter((_, j) => j !== i)); return; }
    if (!window.confirm(`¿Eliminar "${r.nombre}"?`)) return;
    try { await viernesApi.deleteFilamento(r.id); setRows((rs) => rs.filter((_, j) => j !== i)); } catch {}
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--c-text)" }}>Filamentos</h1>
          <p style={{ fontSize: 13, color: "var(--c-text-3)", margin: "4px 0 0" }}>Tipos de material + colores con su tarifa por minuto.</p>
        </div>
        <button onClick={addRow} style={S.primary}>+ Nuevo filamento</button>
      </div>

      {loading ? <p style={{ color: "var(--c-text-3)", fontSize: 14 }}>Cargando…</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.length === 0 && <p style={{ color: "var(--c-text-4)", fontSize: 14 }}>Sin filamentos. Agrega uno.</p>}
          {rows.map((r, i) => (
            <div key={r.id ?? `new-${i}`} style={S.card}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" style={{ alignItems: "end" }}>
                <div style={S.field}>
                  <span style={S.lbl}>Nombre</span>
                  <input value={r.nombre} onChange={(e) => setRow(i, { nombre: e.target.value })} style={S.input} placeholder="PLA Negro" />
                </div>
                <div style={S.field}>
                  <span style={S.lbl}>Tipo</span>
                  <Select value={r.tipo_material} onChange={(v) => setRow(i, { tipo_material: v })} options={TIPOS} />
                </div>
                <div style={S.field}>
                  <span style={S.lbl}>Color</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={r.hex_codigo} onChange={(e) => setRow(i, { hex_codigo: e.target.value })}
                      style={{ width: 34, height: 34, border: "1px solid var(--c-border-med)", borderRadius: 8, background: "transparent", padding: 0, cursor: "pointer" }} />
                    <input value={r.hex_codigo} onChange={(e) => setRow(i, { hex_codigo: e.target.value })} style={{ ...S.input, flex: 1 }} />
                  </div>
                </div>
                <div style={S.field}>
                  <span style={S.lbl}>$/min</span>
                  <input type="number" step={0.05} value={r.tarifa_por_minuto} onChange={(e) => setRow(i, { tarifa_por_minuto: e.target.value })} style={S.input} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--c-text-2)", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!r.en_stock} onChange={(e) => setRow(i, { en_stock: e.target.checked })} /> En stock
                </label>
                <div style={{ flex: 1 }} />
                <button onClick={() => del(i)} style={S.ghost}>Eliminar</button>
                <button onClick={() => save(i)} disabled={savingId === i || !r.nombre.trim()} style={S.primary}>
                  {savingId === i ? "Guardando…" : r._new ? "Crear" : r._dirty ? "Guardar" : "Guardado ✓"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 14 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  lbl: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: { padding: "8px 11px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  primary: { fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--c-accent)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" },
  ghost: { fontSize: 13, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
};
