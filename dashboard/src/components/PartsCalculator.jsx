import { useState } from "react";
import Select from "@components/Select";
import { partCost, mxn, num, int } from "@/lib/pricing";

// Calculadora multi-parte reutilizable (la misma en Precios y en el editor de Piezas).
// Fuente única: lib/pricing.js.

function ColorPicker({ palette, selected, multi, onChange }) {
  const toggle = (hex) => {
    if (multi) onChange(selected.includes(hex) ? selected.filter((h) => h !== hex) : [...selected, hex]);
    else onChange([hex]);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {palette.map((c) => {
        const on = selected.includes(c.hex);
        return (
          <button key={c.hex} type="button" title={c.name} onClick={() => toggle(c.hex)}
            style={{ width: 26, height: 26, borderRadius: 8, background: c.hex, cursor: "pointer",
                     border: on ? "2px solid var(--c-accent-text)" : "1px solid var(--c-border-med)" }} />
        );
      })}
    </div>
  );
}

function newPart(config) {
  return { key: Date.now() + Math.random(), name: "", filamentId: config.materials[0]?.id,
           multi: true, colors: [config.colors[0]?.hex].filter(Boolean), size: "grande", h: 0, m: 60, g: 30 };
}

export default function PartsCalculator({ config }) {
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
              <input value={p.name} onChange={(e) => setPart(p.key, { name: e.target.value })}
                placeholder={`Parte ${i + 1} (opcional)`} style={{ ...S.input, fontWeight: 600, flex: 1 }} />
              {parts.length > 1 && <button onClick={() => removePart(p.key)} style={S.removeBtn}>Quitar</button>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div style={S.field}>
                <span style={S.lbl}>Filamento</span>
                <Select value={p.filamentId} onChange={(v) => setPart(p.key, { filamentId: v })}
                  options={config.materials.map((m) => ({ value: m.id, label: m.label }))} />
              </div>
              <div style={S.field}>
                <span style={S.lbl}>Modo de color</span>
                <Select value={p.multi ? "multi" : "single"}
                  onChange={(v) => setPart(p.key, { multi: v === "multi", colors: v === "multi" ? p.colors : p.colors.slice(0, 1) })}
                  options={[{ value: "single", label: "Un color" }, { value: "multi", label: "Multicolor" }]} />
              </div>
            </div>

            <div style={{ ...S.field, marginTop: 10 }}>
              <span style={S.lbl}>{p.multi ? "Colores" : "Color"}</span>
              <ColorPicker palette={config.colors} selected={p.colors} multi={p.multi} onChange={(cols) => setPart(p.key, { colors: cols })} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
              {!p.multi && (
                <div style={S.field}>
                  <span style={S.lbl}>Tamaño</span>
                  <Select value={p.size} onChange={(v) => setPart(p.key, { size: v })}
                    options={[{ value: "grande", label: "Grande" }, { value: "chica", label: "Chica" }]} />
                </div>
              )}
              <div style={S.field}><span style={S.lbl}>Horas</span>
                <input type="number" min={0} value={p.h} onChange={(e) => setPart(p.key, { h: int(e.target.value) })} style={S.input} /></div>
              <div style={S.field}><span style={S.lbl}>Minutos</span>
                <input type="number" min={0} value={p.m} onChange={(e) => setPart(p.key, { m: int(e.target.value) })} style={S.input} /></div>
              <div style={S.field}><span style={S.lbl}>Gramos</span>
                <input type="number" min={0} value={p.g} disabled={!p.multi && !grande}
                  onChange={(e) => setPart(p.key, { g: num(e.target.value) })}
                  style={{ ...S.input, opacity: (!p.multi && !grande) ? 0.4 : 1 }} /></div>
            </div>

            <div style={{ marginTop: 12, textAlign: "right", fontSize: 13, color: "var(--c-text-3)" }}>
              Subtotal: <b style={{ color: "var(--c-text)" }}>{mxn(cost)}</b>
            </div>
          </div>
        );
      })}

      <button onClick={addPart} style={{ ...S.addBtn, width: "100%", marginBottom: 12 }}>+ Agregar pieza / parte</button>

      <div style={S.card}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={paintOn} onChange={(e) => setPaintOn(e.target.checked)} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>Incluir pintado / acabado</span>
        </label>
        {paintOn && (
          <div className="grid grid-cols-2 gap-2.5" style={{ marginTop: 12 }}>
            <div style={S.field}><span style={S.lbl}>Horas de pintado</span>
              <input type="number" min={0} value={paintH} onChange={(e) => setPaintH(int(e.target.value))} style={S.input} /></div>
            <div style={S.field}><span style={S.lbl}>Materiales pintura ($)</span>
              <input type="number" min={0} value={paintMat} onChange={(e) => setPaintMat(num(e.target.value))} style={S.input} /></div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.calcRow}><span style={{ color: "var(--c-text-3)" }}>Piezas / partes ({parts.length})</span><span style={{ fontWeight: 500, color: "var(--c-text)" }}>{mxn(partsTotal)}</span></div>
        {paintOn && <div style={S.calcRow}><span style={{ color: "var(--c-text-3)" }}>Pintado ({int(paintH)} hrs)</span><span style={{ fontWeight: 500, color: "var(--c-text)" }}>{mxn(paintCost)}</span></div>}
        <div style={S.calcRow}><span style={{ color: "var(--c-text-3)" }}>Costo base total</span><span style={{ fontWeight: 700, color: "var(--c-text)" }}>{mxn(total)}</span></div>
        <div style={{ borderTop: "1px solid var(--c-border)", margin: "12px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 8 }}>
          {config.margins.map((mg, i) => (
            <div key={i} style={{ background: mg.highlight ? "var(--c-accent-bg)" : "var(--c-hover)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--c-text-3)", marginBottom: 4 }}>{mg.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: mg.highlight ? "var(--c-accent-text)" : "var(--c-text)" }}>{mxn(total * mg.mult)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "16px 18px", marginBottom: 12 },
  pieceCard: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 14, marginBottom: 10 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  lbl: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: { padding: "7px 10px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  addBtn: { marginTop: 4, fontSize: 13, fontWeight: 500, color: "var(--c-accent-text)", background: "var(--c-accent-bg)", border: "1px solid var(--c-border-med)", borderRadius: 8, padding: "7px 12px", cursor: "pointer" },
  removeBtn: { fontSize: 12, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "5px 12px", cursor: "pointer" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, padding: "6px 0", borderBottom: "1px solid var(--c-border)" },
};
