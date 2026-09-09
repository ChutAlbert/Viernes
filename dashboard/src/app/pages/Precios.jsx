import { useState, useEffect } from "react";
import Select from "@components/Select";
import PartsCalculator from "@components/PartsCalculator";
// Fuente unica: antes esta pantalla tenia su propia copia de la logica
import { DEFAULT_CONFIG, mxn, num, int, mins, partCost } from "@/lib/pricing";
import { useConfig } from "@/lib/usePricingConfig";


const TABS = [
  { id: "piezas",     label: "Piezas" },
  { id: "filamentos", label: "Filamentos" },
  { id: "ajustes",    label: "Ajustes" },
];




// ── UI bits ──────────────────────────────────────────────────────────────────
// ── Tab: Piezas ──────────────────────────────────────────────────────────────
// ── Tab: Filamentos (tipos + colores) ────────────────────────────────────────
function TabFilamentos({ config, setConfig }) {
  const setMat = (i, patch) => setConfig((c) => ({ ...c, materials: c.materials.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const addMat = () => setConfig((c) => ({ ...c, materials: [...c.materials, { id: `mat_${Date.now()}`, label: "Nuevo", cost: 0.40, market: 1.20 }] }));
  const rmMat = (i) => setConfig((c) => ({ ...c, materials: c.materials.length > 1 ? c.materials.filter((_, j) => j !== i) : c.materials }));

  return (
    <div>
      <h3 style={S.sectionTitle}>Tipos de filamento</h3>
      <p style={{ fontSize: 12, color: "var(--c-text-4)", marginBottom: 8 }}>
        <b>Costo</b> es lo que te cuesta el gramo. <b>Mercado</b> es la tarifa de venta
        de referencia — no entra en el precio, solo sirve de comparación.
      </p>
      <div style={S.card}>
        <div style={{ ...S.rowFlex, ...S.head }}>
          <span style={{ flex: 2 }}>Nombre</span>
          <span style={{ flex: 1, textAlign: "center" }}>Costo $/g</span>
          <span style={{ flex: 1, textAlign: "center" }}>Mercado $/g</span>
          <span style={{ width: 26 }} />
        </div>
        {config.materials.map((m, i) => (
          <div key={m.id} style={S.rowFlex}>
            <input value={m.label} onChange={(e) => setMat(i, { label: e.target.value })} style={{ ...S.input, flex: 2 }} />
            <input type="number" step={0.01} value={m.cost} onChange={(e) => setMat(i, { cost: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <input type="number" step={0.05} value={m.market} onChange={(e) => setMat(i, { market: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <button onClick={() => rmMat(i)} style={S.rowDel}>✕</button>
          </div>
        ))}
        <button onClick={addMat} style={S.addBtn}>+ Agregar tipo</button>
      </div>

    </div>
  );
}

// ── Tab: Ajustes ─────────────────────────────────────────────────────────────
function TabAjustes({ config, setConfig }) {
  const set = (key) => (val) => setConfig((c) => ({ ...c, [key]: val }));
  const setMargin = (i, patch) => setConfig((c) => ({ ...c, margins: c.margins.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const addMargin = () => setConfig((c) => ({ ...c, margins: [...c.margins, { label: "+0%", mult: 1 }] }));
  const rmMargin = (i) => setConfig((c) => ({ ...c, margins: c.margins.length > 1 ? c.margins.filter((_, j) => j !== i) : c.margins }));

  const Field = ({ label, hint, value, onChange, step = 0.05 }) => (
    <div style={S.field}>
      <span style={S.fieldLbl}>{label}</span>
      <input type="number" value={value} step={step} onChange={(e) => onChange(num(e.target.value))} style={S.input} />
      {hint && <span style={S.hint}>{hint}</span>}
    </div>
  );

  return (
    <div>
      <h3 style={S.sectionTitle}>Operación</h3>
      <div style={S.card}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Field label="Tarifa máquina ($/hr)" hint="Desgaste, luz y mantenimiento" value={config.machine_hr} onChange={set("machine_hr")} step={0.25} />
          <Field label="Merma / riesgo (%)" hint="Fallidas y calibraciones. 0.12 = 12%"
            value={config.waste_pct} onChange={set("waste_pct")} step={0.01} />
          <Field label="Mano de obra ($/hr)" hint="Tu tiempo con las manos" value={config.labor_hr} onChange={set("labor_hr")} step={10} />
          <Field label="Precio mínimo ($)" hint="Piso para piezas chicas" value={config.min_price} onChange={set("min_price")} step={10} />
        </div>
      </div>

      <h3 style={S.sectionTitle}>Pintado</h3>
      <div style={S.card}>
        <div style={{ maxWidth: 220 }}>
          <Field label="Mano de obra ($/hr)" value={config.paint_hr} onChange={set("paint_hr")} step={10} />
        </div>
      </div>

      <h3 style={S.sectionTitle}>Multiplicadores de margen</h3>
      <div style={S.card}>
        <div style={{ ...S.rowFlex, ...S.head }}>
          <span style={{ flex: 1.5 }}>Etiqueta</span>
          <span style={{ flex: 1, textAlign: "center" }}>Multiplicador</span>
          <span style={{ width: 70, textAlign: "center" }}>Destacar</span>
          <span style={{ width: 26 }} />
        </div>
        {config.margins.map((mg, i) => (
          <div key={i} style={S.rowFlex}>
            <input value={mg.label} onChange={(e) => setMargin(i, { label: e.target.value })} style={{ ...S.input, flex: 1.5 }} />
            <input type="number" step={0.05} value={mg.mult} onChange={(e) => setMargin(i, { mult: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <label style={{ width: 70, display: "flex", justifyContent: "center" }}>
              <input type="checkbox" checked={!!mg.highlight} onChange={(e) => setMargin(i, { highlight: e.target.checked })} />
            </label>
            <button onClick={() => rmMargin(i)} style={S.rowDel}>✕</button>
          </div>
        ))}
        <button onClick={addMargin} style={S.addBtn}>+ Agregar multiplicador</button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Precios() {
  const [config, setConfig] = useConfig();
  const [tab, setTab] = useState("piezas");
  const [nombre, setNombre] = useState("");

  return (
    <div style={{ maxWidth: 780, color: "var(--c-text)" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Calculadora de precios</h1>
      <p style={{ fontSize: 13, color: "var(--c-text-3)", margin: "0 0 16px" }}>Sodigic · Impresión 3D</p>

      {/* Nombre del trabajo — siempre arriba */}
      <div style={{ ...S.field, marginBottom: 18 }}>
        <span style={S.fieldLbl}>Nombre del trabajo</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Figura Goku multicolor" style={{ ...S.input, maxWidth: 420 }} />
      </div>

      <div style={S.tabs}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ paddingBottom: 40 }}>
        {tab === "piezas"     && <PartsCalculator config={config} />}
        {tab === "filamentos" && <TabFilamentos config={config} setConfig={setConfig} />}
        {tab === "ajustes"    && <TabAjustes config={config} setConfig={setConfig} />}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  sectionTitle: { fontSize: 12, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "18px 0 8px" },
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "16px 18px", marginBottom: 12 },
  pieceCard: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 14, marginBottom: 10 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  fieldLbl: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  hint: { fontSize: 12, color: "var(--c-text-4)" },
  input: { padding: "7px 10px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  tabs: { display: "flex", gap: 4, borderBottom: "1px solid var(--c-border-med)", marginBottom: 20, flexWrap: "wrap" },
  tab: { position: "relative", zIndex: 1, padding: "8px 14px", fontSize: 14, fontWeight: 500, color: "var(--c-text-3)", background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: "transparent", cursor: "pointer", marginBottom: -2, whiteSpace: "nowrap" },
  tabActive: { color: "var(--c-accent-text)", borderBottomColor: "var(--c-accent)" },
  rowFlex: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  head: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  rowDel: { width: 26, height: 30, borderRadius: 6, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text-4)", cursor: "pointer", flexShrink: 0 },
  removeBtn: { fontSize: 12, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "5px 12px", cursor: "pointer" },
  addBtn: { marginTop: 4, fontSize: 13, fontWeight: 500, color: "var(--c-accent-text)", background: "var(--c-accent-bg)", border: "1px solid var(--c-border-med)", borderRadius: 8, padding: "7px 12px", cursor: "pointer" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, padding: "6px 0", borderBottom: "1px solid var(--c-border)" },
  divider: { borderTop: "1px solid var(--c-border)", margin: "12px 0" },
  marginCard: { background: "var(--c-hover)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "10px 12px", textAlign: "center" },
  marginCardHi: { background: "var(--c-accent-bg)", border: "1px solid var(--c-border-med)" },
};
