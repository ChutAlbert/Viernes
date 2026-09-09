import { useState, useEffect, useRef } from "react";
import Select from "@components/Select";
import { piecePrice, mxn, num, int } from "@/lib/pricing";

// Calculadora de precios: la misma en Precios y en el editor de Piezas.
// Una parte solo aporta material y máquina; merma, mano de obra, extras y el
// precio mínimo se aplican al total de la pieza, no parte por parte.

function newPart(config) {
  return {
    key: Date.now() + Math.random(),
    name: "",
    filamentId: config.materials[0]?.id,
    h: 0, m: 60, g: 30,
  };
}

const PIEZA_VACIA = {
  laborHours: 0,
  multicolorFee: 0,
  painting: { enabled: false, hours: 2, materials: 80 },
  qty: 1,
};

// `inicial` rehidrata lo guardado; `onCambio` lo reporta para que se persista.
export default function PartsCalculator({ config, inicial = null, onCambio = null }) {
  const [parts, setParts] = useState(() =>
    inicial?.parts?.length
      // Las partes viejas traen size/multi; se ignoran, ya no entran al cálculo
      ? inicial.parts.map((x, i) => ({ ...newPart(config), ...x, key: x.key ?? i }))
      : [newPart(config)]);
  const [extra, setExtra] = useState(() => ({
    ...PIEZA_VACIA,
    ...(inicial ?? {}),
    painting: { ...PIEZA_VACIA.painting, ...(inicial?.painting ?? {}) },
  }));

  const setPart = (key, patch) => setParts((ps) => ps.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const addPart = () => setParts((ps) => [...ps, newPart(config)]);
  const removePart = (key) => setParts((ps) => (ps.length > 1 ? ps.filter((p) => p.key !== key) : ps));
  const setExtraCampo = (k) => (v) => setExtra((e) => ({ ...e, [k]: v }));
  const setPintado = (k) => (v) => setExtra((e) => ({ ...e, painting: { ...e.painting, [k]: v } }));

  // Al montar no reportamos: marcaría la pieza como modificada sin tocarla.
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) { montado.current = true; return; }
    if (onCambio) onCambio({ ...extra, parts });
  }, [parts, extra]);

  const r = piecePrice({ ...extra, parts }, config);
  const pintado = extra.painting;

  return (
    <div>
      {parts.map((p, i) => (
        <div key={p.key} style={S.pieceCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
            <input value={p.name} onChange={(e) => setPart(p.key, { name: e.target.value })}
              placeholder={`Parte ${i + 1} (opcional)`} style={{ ...S.input, fontWeight: 600, flex: 1 }} />
            {parts.length > 1 && <button onClick={() => removePart(p.key)} style={S.removeBtn}>Quitar</button>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div style={S.field}>
              <span style={S.lbl}>Filamento</span>
              <Select value={p.filamentId} onChange={(v) => setPart(p.key, { filamentId: v })}
                options={config.materials.map((m) => ({ value: m.id, label: m.label }))} />
            </div>
            <div style={S.field}><span style={S.lbl}>Horas</span>
              <input type="number" min={0} value={p.h} onChange={(e) => setPart(p.key, { h: int(e.target.value) })} style={S.input} /></div>
            <div style={S.field}><span style={S.lbl}>Minutos</span>
              <input type="number" min={0} value={p.m} onChange={(e) => setPart(p.key, { m: int(e.target.value) })} style={S.input} /></div>
            <div style={S.field}><span style={S.lbl}>Gramos</span>
              <input type="number" min={0} value={p.g} onChange={(e) => setPart(p.key, { g: num(e.target.value) })} style={S.input} /></div>
          </div>
        </div>
      ))}

      <button onClick={addPart} style={{ ...S.addBtn, width: "100%", padding: "10px 12px", marginBottom: 12 }}>
        + Agregar pieza / parte
      </button>

      <div style={S.card}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div style={S.field}>
            <span style={S.lbl}>Horas de trabajo manual</span>
            <input type="number" min={0} step="0.5" value={extra.laborHours}
              onChange={(e) => setExtraCampo("laborHours")(num(e.target.value))} style={S.input} />
            <span style={S.hint}>Laminado, soportes, lijado, ensamble</span>
          </div>
          <div style={S.field}>
            <span style={S.lbl}>Extra multicolor</span>
            <Select value={String(extra.multicolorFee)}
              onChange={(v) => setExtraCampo("multicolorFee")(num(v))}
              options={config.multicolor_fees.map((f) => ({ value: String(f), label: f === 0 ? "Sin multicolor" : mxn(f) }))} />
          </div>
          <div style={S.field}>
            <span style={S.lbl}>Cantidad</span>
            <input type="number" min={1} value={extra.qty}
              onChange={(e) => setExtraCampo("qty")(int(e.target.value) || 1)} style={S.input} />
            {r.descuento > 0 && <span style={{ ...S.hint, color: "var(--c-accent-text)" }}>Descuento {Math.round(r.descuento * 100)}%</span>}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={pintado.enabled} onChange={(e) => setPintado("enabled")(e.target.checked)} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>Incluir pintado / acabado</span>
        </label>
        {pintado.enabled && (
          <div className="grid grid-cols-2 gap-2.5" style={{ marginTop: 12 }}>
            <div style={S.field}><span style={S.lbl}>Horas de pintado</span>
              <input type="number" min={0} value={pintado.hours} onChange={(e) => setPintado("hours")(num(e.target.value))} style={S.input} /></div>
            <div style={S.field}><span style={S.lbl}>Materiales pintura ($)</span>
              <input type="number" min={0} value={pintado.materials} onChange={(e) => setPintado("materials")(num(e.target.value))} style={S.input} /></div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <Renglon etiqueta={`Impresión — material y máquina (${parts.length} ${parts.length === 1 ? "parte" : "partes"})`} valor={r.impresion} />
        <Renglon etiqueta={`Merma ${Math.round(config.waste_pct * 100)}%`} valor={r.merma} />
        {r.mano > 0 && <Renglon etiqueta={`Mano de obra (${num(extra.laborHours)} h)`} valor={r.mano} />}
        {r.pintado > 0 && <Renglon etiqueta={`Pintado (${num(pintado.hours)} h)`} valor={r.pintado} />}
        {r.multicolor > 0 && <Renglon etiqueta="Extra multicolor" valor={r.multicolor} />}
        <Renglon etiqueta="Costo total" valor={r.total} fuerte />

        <div style={{ borderTop: "1px solid var(--c-border)", margin: "12px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
          {r.precios.map((mg, i) => (
            <div key={i} style={{ background: mg.highlight ? "var(--c-accent-bg)" : "var(--c-hover)", border: "1px solid var(--c-border)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--c-text-3)", marginBottom: 4 }}>{mg.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: mg.highlight ? "var(--c-accent-text)" : "var(--c-text)" }}>{mxn(mg.unidad)}</div>
              {mg.minimoAplicado && <div style={{ fontSize: 10, color: "var(--c-text-4)", marginTop: 2 }}>mínimo</div>}
            </div>
          ))}
        </div>

        {r.cantidad > 1 && (
          <div style={{ ...S.calcRow, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--c-border)" }}>
            <span style={{ color: "var(--c-text-3)" }}>Total por {r.cantidad} piezas (al {r.precios.find((m) => m.highlight)?.label ?? ""})</span>
            <span style={{ fontWeight: 700, color: "var(--c-text)" }}>
              {mxn((r.precios.find((m) => m.highlight) ?? r.precios[0]).unidad * r.cantidad)}
            </span>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, color: "var(--c-text-4)", lineHeight: 1.6 }}>
          Referencia de mercado: <b style={{ color: "var(--c-text-3)" }}>{mxn(r.referencia)}</b>
          {" — "}tarifa por gramo que se maneja en el mercado. No entra en el precio;
          sirve para detectar si falta mano de obra o si el laminado está caro.
        </div>
      </div>
    </div>
  );
}

function Renglon({ etiqueta, valor, fuerte }) {
  return (
    <div style={S.calcRow}>
      <span style={{ color: "var(--c-text-3)" }}>{etiqueta}</span>
      <span style={{ fontWeight: fuerte ? 700 : 500, color: "var(--c-text)" }}>{mxn(valor)}</span>
    </div>
  );
}

const S = {
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: "16px 18px", marginBottom: 12 },
  pieceCard: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 14, marginBottom: 10 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  lbl: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  hint: { fontSize: 11, color: "var(--c-text-4)" },
  input: { padding: "7px 10px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  addBtn: { marginTop: 4, fontSize: 13, fontWeight: 500, color: "var(--c-accent-text)", background: "var(--c-accent-bg)", border: "1px solid var(--c-border-med)", borderRadius: 8, padding: "7px 12px", cursor: "pointer" },
  removeBtn: { fontSize: 12, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "5px 12px", cursor: "pointer" },
  calcRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "5px 0" },
};
