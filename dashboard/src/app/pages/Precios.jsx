import { useState, useEffect } from "react";
import Select from "@components/Select";
import PartsCalculator from "@components/PartsCalculator";

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  // Tipos de filamento
  materials: [
    { id: "pla",  label: "PLA / PLA+", minRate: 0.60, gRate: 0.50 },
    { id: "petg", label: "PETG",       minRate: 0.80, gRate: 0.70 },
    { id: "tpu",  label: "TPU",        minRate: 1.00, gRate: 0.90 },
  ],
  // Paleta de colores disponible
  colors: [
    { name: "Negro",   hex: "#1a1a1a" },
    { name: "Blanco",  hex: "#f5f5f5" },
    { name: "Gris",    hex: "#8a8a8a" },
    { name: "Rojo",    hex: "#e11d48" },
    { name: "Naranja", hex: "#f59e0b" },
    { name: "Amarillo",hex: "#eab308" },
    { name: "Verde",   hex: "#22c55e" },
    { name: "Azul",    hex: "#3b82f6" },
    { name: "Morado",  hex: "#8b5cf6" },
  ],
  machine_hr: 6.85,   // multicolor $/hr máquina
  filament_g: 0.315,  // multicolor $/g filamento
  paint_hr: 100,      // pintado $/hr
  margins: [
    { label: "+40%",  mult: 1.4 },
    { label: "+60%",  mult: 1.6, highlight: true },
    { label: "+100%", mult: 2.0 },
  ],
};

const TABS = [
  { id: "piezas",     label: "Piezas" },
  { id: "filamentos", label: "Filamentos" },
  { id: "ajustes",    label: "Ajustes" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const mxn = (n) => `$${Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} MXN`;
const num = (v) => parseFloat(v) || 0;
const int = (v) => Math.max(0, parseInt(v) || 0);
const mins = (h, m) => int(h) * 60 + int(m);

function partCost(p, config) {
  const mat = config.materials.find((m) => m.id === p.filamentId) || config.materials[0];
  const minutes = mins(p.h, p.m);
  if (p.multi) {
    // Multicolor: material por gramo + máquina por hora
    return num(p.g) * config.filament_g + (minutes / 60) * config.machine_hr;
  }
  // Monocolor: tiempo por minuto (+ gramos si es grande)
  const t = minutes * (mat ? mat.minRate : 0);
  const g = p.size === "grande" ? num(p.g) * (mat ? mat.gRate : 0) : 0;
  return t + g;
}

// ── Config persistente ───────────────────────────────────────────────────────
function useConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("sodigic_pricing_config");
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });
  useEffect(() => {
    try { localStorage.setItem("sodigic_pricing_config", JSON.stringify(config)); } catch {}
  }, [config]);
  return [config, setConfig];
}

// ── UI bits ──────────────────────────────────────────────────────────────────
function CalcRow({ label, value, strong }) {
  return (
    <div style={S.calcRow}>
      <span style={{ color: "var(--c-text-3)" }}>{label}</span>
      <span style={{ fontWeight: strong ? 700 : 500, color: "var(--c-text)" }}>{value}</span>
    </div>
  );
}

function MarginCards({ base, margins }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 8 }}>
      {margins.map(({ label, mult, highlight }, i) => (
        <div key={i} style={{ ...S.marginCard, ...(highlight ? S.marginCardHi : {}) }}>
          <div style={{ fontSize: 12, color: "var(--c-text-3)", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: highlight ? "var(--c-accent-text)" : "var(--c-text)" }}>
            {mxn(base * mult)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorPicker({ palette, selected, multi, onChange }) {
  const toggle = (hex) => {
    if (multi) {
      onChange(selected.includes(hex) ? selected.filter((h) => h !== hex) : [...selected, hex]);
    } else {
      onChange([hex]);
    }
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {palette.map((c) => {
        const on = selected.includes(c.hex);
        return (
          <button
            key={c.hex}
            type="button"
            title={c.name}
            onClick={() => toggle(c.hex)}
            style={{
              width: 26, height: 26, borderRadius: 8, background: c.hex, cursor: "pointer",
              border: on ? "2px solid var(--c-accent-text)" : "1px solid var(--c-border-med)",
              outline: on ? "2px solid var(--c-accent-bg)" : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Tab: Piezas ──────────────────────────────────────────────────────────────
function newPart(config) {
  return {
    key: Date.now() + Math.random(), name: "", filamentId: config.materials[0]?.id,
    multi: false, colors: [config.colors[0]?.hex].filter(Boolean), size: "grande", h: 0, m: 60, g: 30,
  };
}

function TabPiezas({ config }) {
  const [parts, setParts] = useState(() => [newPart(config)]);
  const [paintOn, setPaintOn] = useState(false);
  const [paintH, setPaintH] = useState(2);
  const [paintMat, setPaintMat] = useState(80);

  const setPart = (key, patch) => setParts((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const addPart = () => setParts((ps) => [...ps, newPart(config)]);
  const removePart = (key) => setParts((ps) => (ps.length > 1 ? ps.filter((p) => p.key !== key) : ps));

  const rows = parts.map((p) => ({ p, cost: partCost(p, config) }));
  const partsTotal = rows.reduce((s, r) => s + r.cost, 0);
  const paintCost = paintOn ? int(paintH) * config.paint_hr + num(paintMat) : 0;
  const total = partsTotal + paintCost;

  return (
    <div>
      {rows.map(({ p, cost }, i) => {
        const grande = p.size === "grande";
        return (
          <div key={p.key} style={S.pieceCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
              <input
                value={p.name}
                onChange={(e) => setPart(p.key, { name: e.target.value })}
                placeholder={`Parte ${i + 1} (opcional)`}
                style={{ ...S.input, fontWeight: 600, flex: 1 }}
              />
              {parts.length > 1 && <button onClick={() => removePart(p.key)} style={S.removeBtn}>Quitar</button>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div style={S.field}>
                <span style={S.fieldLbl}>Filamento</span>
                <Select value={p.filamentId} onChange={(v) => setPart(p.key, { filamentId: v })}
                  options={config.materials.map((m) => ({ value: m.id, label: m.label }))} />
              </div>
              <div style={S.field}>
                <span style={S.fieldLbl}>Modo de color</span>
                <Select value={p.multi ? "multi" : "single"}
                  onChange={(v) => setPart(p.key, { multi: v === "multi", colors: v === "multi" ? p.colors : p.colors.slice(0, 1) })}
                  options={[{ value: "single", label: "Un color" }, { value: "multi", label: "Multicolor" }]} />
              </div>
            </div>

            <div style={{ ...S.field, marginTop: 10 }}>
              <span style={S.fieldLbl}>{p.multi ? "Colores" : "Color"}</span>
              <ColorPicker palette={config.colors} selected={p.colors} multi={p.multi}
                onChange={(cols) => setPart(p.key, { colors: cols })} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
              {!p.multi && (
                <div style={S.field}>
                  <span style={S.fieldLbl}>Tamaño</span>
                  <Select value={p.size} onChange={(v) => setPart(p.key, { size: v })}
                    options={[{ value: "grande", label: "Grande" }, { value: "chica", label: "Chica" }]} />
                </div>
              )}
              <div style={S.field}>
                <span style={S.fieldLbl}>Horas</span>
                <input type="number" min={0} value={p.h} onChange={(e) => setPart(p.key, { h: int(e.target.value) })} style={S.input} />
              </div>
              <div style={S.field}>
                <span style={S.fieldLbl}>Minutos</span>
                <input type="number" min={0} value={p.m} onChange={(e) => setPart(p.key, { m: int(e.target.value) })} style={S.input} />
              </div>
              <div style={S.field}>
                <span style={S.fieldLbl}>Gramos</span>
                <input type="number" min={0} value={p.g} disabled={!p.multi && !grande}
                  onChange={(e) => setPart(p.key, { g: num(e.target.value) })}
                  style={{ ...S.input, opacity: (!p.multi && !grande) ? 0.4 : 1 }} />
              </div>
            </div>

            <div style={{ marginTop: 12, textAlign: "right", fontSize: 13, color: "var(--c-text-3)" }}>
              Subtotal: <b style={{ color: "var(--c-text)" }}>{mxn(cost)}</b>
            </div>
          </div>
        );
      })}

      <button onClick={addPart} style={{ ...S.addBtn, width: "100%", marginBottom: 12 }}>+ Agregar pieza / parte</button>

      {/* Pintado opcional */}
      <div style={S.card}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={paintOn} onChange={(e) => setPaintOn(e.target.checked)} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>Incluir pintado / acabado</span>
        </label>
        {paintOn && (
          <div className="grid grid-cols-2 gap-2.5" style={{ marginTop: 12 }}>
            <div style={S.field}>
              <span style={S.fieldLbl}>Horas de pintado</span>
              <input type="number" min={0} value={paintH} onChange={(e) => setPaintH(int(e.target.value))} style={S.input} />
            </div>
            <div style={S.field}>
              <span style={S.fieldLbl}>Materiales pintura ($)</span>
              <input type="number" min={0} value={paintMat} onChange={(e) => setPaintMat(num(e.target.value))} style={S.input} />
            </div>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div style={S.card}>
        <CalcRow label={`Piezas / partes (${parts.length})`} value={mxn(partsTotal)} />
        {paintOn && <CalcRow label={`Pintado (${int(paintH)} hrs)`} value={mxn(paintCost)} />}
        <CalcRow label="Costo base total" value={mxn(total)} strong />
        <div style={S.divider} />
        <MarginCards base={total} margins={config.margins} />
      </div>
    </div>
  );
}

// ── Tab: Filamentos (tipos + colores) ────────────────────────────────────────
function TabFilamentos({ config, setConfig }) {
  const setMat = (i, patch) => setConfig((c) => ({ ...c, materials: c.materials.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const addMat = () => setConfig((c) => ({ ...c, materials: [...c.materials, { id: `mat_${Date.now()}`, label: "Nuevo", minRate: 0.6, gRate: 0.5 }] }));
  const rmMat = (i) => setConfig((c) => ({ ...c, materials: c.materials.length > 1 ? c.materials.filter((_, j) => j !== i) : c.materials }));

  const setColor = (i, patch) => setConfig((c) => ({ ...c, colors: c.colors.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const addColor = () => setConfig((c) => ({ ...c, colors: [...c.colors, { name: "Nuevo", hex: "#888888" }] }));
  const rmColor = (i) => setConfig((c) => ({ ...c, colors: c.colors.length > 1 ? c.colors.filter((_, j) => j !== i) : c.colors }));

  return (
    <div>
      <h3 style={S.sectionTitle}>Tipos de filamento</h3>
      <div style={S.card}>
        <div style={{ ...S.rowFlex, ...S.head }}>
          <span style={{ flex: 2 }}>Nombre</span>
          <span style={{ flex: 1, textAlign: "center" }}>$/min</span>
          <span style={{ flex: 1, textAlign: "center" }}>$/g</span>
          <span style={{ width: 26 }} />
        </div>
        {config.materials.map((m, i) => (
          <div key={m.id} style={S.rowFlex}>
            <input value={m.label} onChange={(e) => setMat(i, { label: e.target.value })} style={{ ...S.input, flex: 2 }} />
            <input type="number" step={0.05} value={m.minRate} onChange={(e) => setMat(i, { minRate: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <input type="number" step={0.05} value={m.gRate} onChange={(e) => setMat(i, { gRate: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <button onClick={() => rmMat(i)} style={S.rowDel}>✕</button>
          </div>
        ))}
        <button onClick={addMat} style={S.addBtn}>+ Agregar tipo</button>
      </div>

      <h3 style={S.sectionTitle}>Paleta de colores</h3>
      <div style={S.card}>
        {config.colors.map((c, i) => (
          <div key={i} style={S.rowFlex}>
            <input type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })}
              style={{ width: 34, height: 34, border: "1px solid var(--c-border-med)", borderRadius: 8, background: "transparent", cursor: "pointer", padding: 0 }} />
            <input value={c.name} onChange={(e) => setColor(i, { name: e.target.value })} style={{ ...S.input, flex: 1 }} />
            <button onClick={() => rmColor(i)} style={S.rowDel}>✕</button>
          </div>
        ))}
        <button onClick={addColor} style={S.addBtn}>+ Agregar color</button>
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
      <h3 style={S.sectionTitle}>Multicolor</h3>
      <div style={S.card}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Field label="Tarifa máquina ($/hr)" hint="Depreciación + luz + consumibles" value={config.machine_hr} onChange={set("machine_hr")} step={0.25} />
          <Field label="Costo filamento ($/g)" hint="PLA+ ~$315/kg" value={config.filament_g} onChange={set("filament_g")} step={0.005} />
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
