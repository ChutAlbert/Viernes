import { useState, useEffect } from "react";
import Select from "@components/Select";

// ── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  materials: [
    { id: "pla",  label: "PLA / PLA+", minRate: 0.60, gRate: 0.50 },
    { id: "petg", label: "PETG",       minRate: 0.80, gRate: 0.70 },
    { id: "tpu",  label: "TPU",        minRate: 1.00, gRate: 0.90 },
  ],
  machine_hr: 6.85,   // multicolor $/hr máquina
  filament_g: 0.315,  // multicolor $/g filamento
  paint_hr: 100,      // pintado $/hr mano de obra
  paint_mat: 80,      // pintado materiales base $
  margins: [
    { label: "+40%",  mult: 1.4 },
    { label: "+60%",  mult: 1.6, highlight: true },
    { label: "+100%", mult: 2.0 },
  ],
};

const TABS = [
  { id: "monocolor",  label: "Monocolor" },
  { id: "multicolor", label: "Multicolor" },
  { id: "pintado",    label: "Pintado" },
  { id: "config",     label: "Configuración" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const mxn = (n) => `$${Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} MXN`;
const num = (v) => parseFloat(v) || 0;
const int = (v) => Math.max(0, parseInt(v) || 0);
const mins = (h, m) => int(h) * 60 + int(m);

// ── Shared bits ──────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={S.sectionTitle}>{title}</h3>
      <div style={S.card}>{children}</div>
    </div>
  );
}

function FormulaBox({ children }) {
  return <pre style={S.formulaBox}>{children}</pre>;
}

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
          <div style={{ fontSize: 12, color: "var(--c-text-3)", marginBottom: 4 }}>{label} margen</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: highlight ? "var(--c-accent-text)" : "var(--c-text)" }}>
            {mxn(base * mult)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfigField({ label, hint, value, onChange, step = 0.05 }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <input type="number" value={value} step={step} onChange={(e) => onChange(num(e.target.value))} style={S.input} />
      {hint && <span style={S.hint}>{hint}</span>}
    </div>
  );
}

// ── Monocolor: multi-pieza ───────────────────────────────────────────────────
function newPiece(matId) {
  return { key: Date.now() + Math.random(), material: matId, size: "grande", h: 0, m: 60, g: 30 };
}

function pieceBase(p, materials) {
  const mat = materials.find((m) => m.id === p.material) || materials[0];
  if (!mat) return { tCost: 0, mCost: 0, base: 0 };
  const tCost = mins(p.h, p.m) * mat.minRate;
  const mCost = p.size === "grande" ? num(p.g) * mat.gRate : 0;
  return { tCost, mCost, base: tCost + mCost };
}

function TabMonocolor({ config }) {
  const [pieces, setPieces] = useState(() => [newPiece(config.materials[0]?.id)]);

  const setPiece = (key, patch) =>
    setPieces((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const addPiece = () => setPieces((ps) => [...ps, newPiece(config.materials[0]?.id)]);
  const removePiece = (key) => setPieces((ps) => (ps.length > 1 ? ps.filter((p) => p.key !== key) : ps));

  const rows = pieces.map((p) => ({ p, ...pieceBase(p, config.materials) }));
  const total = rows.reduce((s, r) => s + r.base, 0);

  return (
    <div>
      <FormulaBox>
        Por pieza: (horas·60 + min) × $/min  +  (grande ? g × $/g : 0){"\n"}
        Total del trabajo = suma de todas las piezas
      </FormulaBox>

      {rows.map(({ p, base }, i) => {
        const grande = p.size === "grande";
        return (
          <div key={p.key} style={S.pieceCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pieza {i + 1}</span>
              {pieces.length > 1 && <button onClick={() => removePiece(p.key)} style={S.removeBtn}>Quitar</button>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div style={S.field}>
                <span style={S.fieldLbl}>Material</span>
                <Select value={p.material} onChange={(v) => setPiece(p.key, { material: v })}
                  options={config.materials.map((m) => ({ value: m.id, label: m.label }))} />
              </div>
              <div style={S.field}>
                <span style={S.fieldLbl}>Tamaño</span>
                <Select value={p.size} onChange={(v) => setPiece(p.key, { size: v })}
                  options={[{ value: "grande", label: "Grande (min + g)" }, { value: "chica", label: "Chica (solo min)" }]} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-2.5">
              <div style={S.field}>
                <span style={S.fieldLbl}>Horas</span>
                <input type="number" min={0} value={p.h} onChange={(e) => setPiece(p.key, { h: int(e.target.value) })} style={S.input} />
              </div>
              <div style={S.field}>
                <span style={S.fieldLbl}>Minutos</span>
                <input type="number" min={0} value={p.m} onChange={(e) => setPiece(p.key, { m: int(e.target.value) })} style={S.input} />
              </div>
              <div style={S.field}>
                <span style={S.fieldLbl}>Gramos</span>
                <input type="number" min={0} value={p.g} disabled={!grande} onChange={(e) => setPiece(p.key, { g: num(e.target.value) })} style={{ ...S.input, opacity: grande ? 1 : 0.4 }} />
              </div>
            </div>

            <div style={{ marginTop: 12, textAlign: "right", fontSize: 13, color: "var(--c-text-3)" }}>
              Subtotal: <b style={{ color: "var(--c-text)" }}>{mxn(base)}</b>
            </div>
          </div>
        );
      })}

      <button onClick={addPiece} style={{ ...S.addBtn, width: "100%", marginBottom: 12 }}>+ Agregar pieza</button>

      <div style={S.card}>
        <CalcRow label={`Piezas en el trabajo`} value={String(pieces.length)} />
        <CalcRow label="Costo base total" value={mxn(total)} strong />
        <div style={S.divider} />
        <MarginCards base={total} margins={config.margins} />
      </div>
    </div>
  );
}

// ── Multicolor (lote) ────────────────────────────────────────────────────────
function TabMulticolor({ config }) {
  const [gTotal, setGTotal] = useState(300);
  const [h, setH] = useState(10);
  const [m, setM] = useState(0);
  const [n, setN] = useState(1);

  const hrs = int(h) + int(m) / 60;
  const matCost = (num(gTotal) / Math.max(1, n)) * config.filament_g;
  const maqCost = (hrs / Math.max(1, n)) * config.machine_hr;
  const base = matCost + maqCost;
  const base1 = num(gTotal) * config.filament_g + hrs * config.machine_hr;
  const savings = n > 1 && base1 > 0 ? ((base1 - base) / base1) * 100 : 0;

  return (
    <div>
      <FormulaBox>
        precio/figura = (g_total / n) × $/g + (hrs_total / n) × $/hr{"\n"}
        g_total incluye pieza + purge del slicer
      </FormulaBox>

      <div style={S.card}>
        <div style={S.grid2}>
          <div style={S.field}>
            <label style={S.label}>Gramos totales del slicer (pieza + purge)</label>
            <input type="number" min={0} value={gTotal} onChange={(e) => setGTotal(num(e.target.value))} style={S.input} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Tiempo total del slicer</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" min={0} value={h} onChange={(e) => setH(int(e.target.value))} style={S.input} placeholder="hrs" />
              <input type="number" min={0} value={m} onChange={(e) => setM(int(e.target.value))} style={S.input} placeholder="min" />
            </div>
            <span style={S.hint}>Horas y minutos</span>
          </div>
        </div>
        <div style={{ ...S.field, marginTop: 12, maxWidth: 160 }}>
          <label style={S.label}>Figuras en el lote</label>
          <input type="number" min={1} value={n} onChange={(e) => setN(Math.max(1, parseInt(e.target.value) || 1))} style={S.input} />
        </div>
      </div>

      <div style={S.card}>
        <CalcRow label="Costo material / figura" value={mxn(matCost)} />
        <CalcRow label="Costo máquina / figura" value={mxn(maqCost)} />
        <CalcRow label="Costo base / figura" value={mxn(base)} strong />
        <div style={S.divider} />
        <MarginCards base={base} margins={config.margins} />
        {n > 1 && <div style={{ ...S.notice, marginTop: 12 }}>Lote de {n}: ahorro de {savings.toFixed(0)}% vs pieza individual.</div>}
      </div>
    </div>
  );
}

// ── Pintado ──────────────────────────────────────────────────────────────────
function TabPintado({ config }) {
  const [baseImp, setBaseImp] = useState(350);
  const [h, setH] = useState(4);
  const [m, setM] = useState(0);
  const [matPaint, setMatPaint] = useState(config.paint_mat);

  useEffect(() => { setMatPaint(config.paint_mat); }, [config.paint_mat]);

  const hrs = int(h) + int(m) / 60;
  const labor = hrs * config.paint_hr;
  const total = num(baseImp) + labor + num(matPaint);

  return (
    <div>
      <FormulaBox>precio = base_impresión + (hrs_trabajo × $/hr) + materiales_pintura</FormulaBox>

      <div style={S.card}>
        <div style={S.grid2}>
          <div style={S.field}>
            <label style={S.label}>Costo base de impresión ($)</label>
            <input type="number" min={0} value={baseImp} onChange={(e) => setBaseImp(num(e.target.value))} style={S.input} />
            <span style={S.hint}>Usa las pestañas Monocolor/Multicolor</span>
          </div>
          <div style={S.field}>
            <label style={S.label}>Tiempo de pintado</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" min={0} value={h} onChange={(e) => setH(int(e.target.value))} style={S.input} placeholder="hrs" />
              <input type="number" min={0} value={m} onChange={(e) => setM(int(e.target.value))} style={S.input} placeholder="min" />
            </div>
          </div>
        </div>
        <div style={{ ...S.field, marginTop: 12, maxWidth: 200 }}>
          <label style={S.label}>Materiales pintura ($)</label>
          <input type="number" min={0} value={matPaint} onChange={(e) => setMatPaint(num(e.target.value))} style={S.input} />
        </div>
        <div style={S.notice}>Guía: pequeña 1–2 hrs · mediana 2–4 hrs · grande 4–8 hrs · detallada 6–12 hrs</div>
      </div>

      <div style={S.card}>
        <CalcRow label="Costo impresión base" value={mxn(num(baseImp))} />
        <CalcRow label={`Mano de obra (${(hrs).toFixed(2)} hrs × $${config.paint_hr}/hr)`} value={mxn(labor)} />
        <CalcRow label="Materiales pintura" value={mxn(num(matPaint))} />
        <CalcRow label="Subtotal antes de margen" value={mxn(total)} strong />
        <div style={S.divider} />
        <MarginCards base={total} margins={config.margins} />
      </div>
    </div>
  );
}

// ── Config ───────────────────────────────────────────────────────────────────
function TabConfig({ config, setConfig }) {
  const set = (key) => (val) => setConfig((c) => ({ ...c, [key]: val }));

  const setMaterial = (i, patch) =>
    setConfig((c) => ({ ...c, materials: c.materials.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const addMaterial = () =>
    setConfig((c) => ({ ...c, materials: [...c.materials, { id: `mat_${Date.now()}`, label: "Nuevo", minRate: 0.6, gRate: 0.5 }] }));
  const removeMaterial = (i) =>
    setConfig((c) => ({ ...c, materials: c.materials.length > 1 ? c.materials.filter((_, j) => j !== i) : c.materials }));

  const setMargin = (i, patch) =>
    setConfig((c) => ({ ...c, margins: c.margins.map((m, j) => (j === i ? { ...m, ...patch } : m)) }));
  const addMargin = () =>
    setConfig((c) => ({ ...c, margins: [...c.margins, { label: "+0%", mult: 1 }] }));
  const removeMargin = (i) =>
    setConfig((c) => ({ ...c, margins: c.margins.length > 1 ? c.margins.filter((_, j) => j !== i) : c.margins }));

  return (
    <div>
      <Section title="Tipos de material (monocolor)">
        <div style={{ ...S.pieceRow, ...S.pieceHead }}>
          <span style={{ flex: 2 }}>Nombre</span>
          <span style={{ flex: 1, textAlign: "center" }}>$/min</span>
          <span style={{ flex: 1, textAlign: "center" }}>$/g (grande)</span>
          <span style={{ width: 26 }} />
        </div>
        {config.materials.map((m, i) => (
          <div key={m.id} style={S.pieceRow}>
            <input value={m.label} onChange={(e) => setMaterial(i, { label: e.target.value })} style={{ ...S.input, flex: 2 }} />
            <input type="number" step={0.05} value={m.minRate} onChange={(e) => setMaterial(i, { minRate: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <input type="number" step={0.05} value={m.gRate} onChange={(e) => setMaterial(i, { gRate: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <button onClick={() => removeMaterial(i)} title="Quitar" style={S.rowDel}>✕</button>
          </div>
        ))}
        <button onClick={addMaterial} style={S.addBtn}>+ Agregar material</button>
        <div style={S.notice}>Piezas chicas solo cobran $/min. Grandes suman $/g.</div>
      </Section>

      <Section title="Multicolor (máquina + filamento)">
        <div style={S.grid2}>
          <ConfigField label="Tarifa máquina ($/hr)" hint="Depreciación + luz + consumibles" value={config.machine_hr} onChange={set("machine_hr")} step={0.25} />
          <ConfigField label="Costo filamento ($/g)" hint="PLA+ ~$315/kg" value={config.filament_g} onChange={set("filament_g")} step={0.005} />
        </div>
      </Section>

      <Section title="Pintado y acabado">
        <div style={S.grid2}>
          <ConfigField label="Mano de obra ($/hr)" value={config.paint_hr} onChange={set("paint_hr")} step={10} />
          <ConfigField label="Materiales base ($)" value={config.paint_mat} onChange={set("paint_mat")} step={10} />
        </div>
      </Section>

      <Section title="Multiplicadores de margen">
        <div style={{ ...S.pieceRow, ...S.pieceHead }}>
          <span style={{ flex: 1.5 }}>Etiqueta</span>
          <span style={{ flex: 1, textAlign: "center" }}>Multiplicador</span>
          <span style={{ width: 90, textAlign: "center" }}>Destacar</span>
          <span style={{ width: 26 }} />
        </div>
        {config.margins.map((mg, i) => (
          <div key={i} style={S.pieceRow}>
            <input value={mg.label} onChange={(e) => setMargin(i, { label: e.target.value })} style={{ ...S.input, flex: 1.5 }} />
            <input type="number" step={0.05} value={mg.mult} onChange={(e) => setMargin(i, { mult: num(e.target.value) })} style={{ ...S.input, flex: 1, textAlign: "center" }} />
            <label style={{ width: 90, textAlign: "center", display: "flex", justifyContent: "center" }}>
              <input type="checkbox" checked={!!mg.highlight} onChange={(e) => setMargin(i, { highlight: e.target.checked })} />
            </label>
            <button onClick={() => removeMargin(i)} title="Quitar" style={S.rowDel}>✕</button>
          </div>
        ))}
        <button onClick={addMargin} style={S.addBtn}>+ Agregar multiplicador</button>
      </Section>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Precios() {
  const [tab, setTab] = useState("monocolor");
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("sodigic_pricing_config");
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  });

  useEffect(() => {
    try { localStorage.setItem("sodigic_pricing_config", JSON.stringify(config)); } catch {}
  }, [config]);

  const reset = () => {
    if (window.confirm("¿Restaurar toda la configuración a los valores por defecto?")) setConfig(DEFAULT_CONFIG);
  };

  return (
    <div style={{ maxWidth: 760, color: "var(--c-text)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Calculadora de precios</h1>
          <p style={{ fontSize: 13, color: "var(--c-text-3)", margin: "4px 0 0" }}>Sodigic · Impresión 3D</p>
        </div>
        {tab === "config" && <button onClick={reset} style={S.resetBtn}>Restaurar defaults</button>}
      </div>

      <div style={S.tabs}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tab, ...(tab === t.id ? S.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ paddingBottom: 40 }}>
        {tab === "monocolor"  && <TabMonocolor  config={config} />}
        {tab === "multicolor" && <TabMulticolor config={config} />}
        {tab === "pintado"    && <TabPintado    config={config} />}
        {tab === "config"     && <TabConfig     config={config} setConfig={setConfig} />}
      </div>
    </div>
  );
}

// ── Styles (tokens del dashboard) ────────────────────────────────────────────
const S = {
  sectionTitle: { fontSize: 12, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "16px 18px", marginBottom: 12 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 13, color: "var(--c-text-2)", fontWeight: 500 },
  hint: { fontSize: 12, color: "var(--c-text-4)" },
  input: { padding: "7px 10px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  select: { padding: "7px 10px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 13, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  tabs: { display: "flex", gap: 4, borderBottom: "1px solid var(--c-border-med)", marginBottom: 20, flexWrap: "wrap" },
  tab: { padding: "8px 14px", fontSize: 14, fontWeight: 500, color: "var(--c-text-3)", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap" },
  tabActive: { color: "var(--c-accent-text)", borderBottomColor: "var(--c-accent)" },
  pieceCard: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 14, marginBottom: 10 },
  fieldLbl: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  removeBtn: { fontSize: 12, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "5px 12px", cursor: "pointer" },
  pieceRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  pieceHead: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  rowDel: { width: 26, height: 30, borderRadius: 6, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text-4)", cursor: "pointer", flexShrink: 0 },
  addBtn: { marginTop: 4, fontSize: 13, fontWeight: 500, color: "var(--c-accent-text)", background: "var(--c-accent-bg)", border: "1px solid var(--c-border-med)", borderRadius: 8, padding: "7px 12px", cursor: "pointer" },
  notice: { fontSize: 12, color: "var(--c-text-3)", background: "var(--c-hover)", borderRadius: 8, padding: "8px 12px", marginTop: 8, lineHeight: 1.5 },
  formulaBox: { fontSize: 12, fontFamily: "ui-monospace, monospace", color: "var(--c-text-3)", background: "var(--c-hover)", borderLeft: "3px solid var(--c-accent)", borderRadius: "0 6px 6px 0", padding: "10px 14px", marginBottom: 16, lineHeight: 1.7, whiteSpace: "pre-wrap" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, padding: "6px 0", borderBottom: "1px solid var(--c-border)" },
  divider: { borderTop: "1px solid var(--c-border)", margin: "12px 0" },
  marginCard: { background: "var(--c-hover)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "10px 12px", textAlign: "center" },
  marginCardHi: { background: "var(--c-accent-bg)", border: "1px solid var(--c-border-med)" },
  resetBtn: { fontSize: 13, color: "var(--c-text-3)", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" },
};
