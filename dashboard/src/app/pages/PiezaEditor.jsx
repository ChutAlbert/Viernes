import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { viernesApi } from "../../lib/apis/viernes";
import { API_BASE_URL } from "../../lib/apis/client";
import Select from "@components/Select";
import PartsCalculator from "@components/PartsCalculator";
import { useConfig as usePricingConfig } from "@/lib/pricing";

// Cálculo primero; Catálogo fusionado en General
const TABS = [
  { id: "calculo", label: "Cálculo" },
  { id: "general", label: "General" },
  { id: "venta",   label: "Venta" },
];

const num = (v) => (v === "" || v == null ? null : parseFloat(v) || 0);

function Toggle({ on, onChange, label, hint }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)", margin: 0 }}>{label}</p>
        {hint && <p style={{ fontSize: 12, color: "var(--c-text-3)", margin: "2px 0 0" }}>{hint}</p>}
      </div>
      <button type="button" onClick={() => onChange(!on)} role="switch" aria-checked={on}
        style={{ width: 44, height: 26, borderRadius: 999, position: "relative", cursor: "pointer", flexShrink: 0,
                 border: "1px solid var(--c-border-med)", background: on ? "var(--c-accent)" : "var(--c-input-bg)" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={S.lbl}>{label}</span>
      {children}
    </div>
  );
}

// Subida de archivo (foto imagen o 3mf). uploader = fn(formData) -> {url}
function FileUpload({ label, value, accept, image, uploader, onDone }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploader(fd);
      onDone(res?.url || null);
    } catch {/* silencioso */} finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <Field label={label}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {image && value && (
          <img src={value.startsWith("http") ? value : `${API_BASE_URL}${value}`} alt=""
            style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--c-border-med)" }} />
        )}
        <input ref={ref} type="file" accept={accept} onChange={handle} style={{ display: "none" }} />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} style={S.ghost}>
          {busy ? "Subiendo…" : value ? "Cambiar archivo" : "Subir archivo"}
        </button>
        {value && !image && <span style={{ fontSize: 12, color: "var(--c-text-3)" }}>{String(value).split("/").pop()}</span>}
        {value && <button type="button" onClick={() => onDone(null)} style={{ ...S.ghost, color: "#f87171" }}>Quitar</button>}
      </div>
    </Field>
  );
}

export default function PiezaEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [filamentos, setFilamentos] = useState([]);
  const [selFilamentos, setSelFilamentos] = useState([]);
  const [tab, setTab] = useState("calculo");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pcfg] = usePricingConfig();
  const dirty = useRef(false);

  useEffect(() => {
    viernesApi.getProductoCatalogo(id).then((data) => {
      setP(data);
      setSelFilamentos((data.filamentos || []).map((f) => f.filamento_id));
    }).catch(() => {});
    viernesApi.listFilamentos().then(setFilamentos).catch(() => {});
  }, [id]);

  const save = async () => {
    if (!p) return;
    setSaving(true);
    try {
      const payload = { ...p, filamentos: selFilamentos.map((fid) => ({ filamento_id: fid })) };
      delete payload.imagenes;
      const updated = await viernesApi.updateProductoCatalogo(id, payload);
      setP(updated);
      setSelFilamentos((updated.filamentos || []).map((f) => f.filamento_id));
      setSaved(true);
    } catch {/* silencioso */} finally { setSaving(false); }
  };

  // Autoguardado: al cambiar algo (dirty), guarda tras una pausa breve.
  useEffect(() => {
    if (!p || !dirty.current) return;
    const t = setTimeout(() => { dirty.current = false; save(); }, 700);
    return () => clearTimeout(t);
  }, [p, selFilamentos]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => { dirty.current = true; setSaved(false); setP((cur) => ({ ...cur, [k]: v })); };

  const toggleFil = (fid) => {
    dirty.current = true; setSaved(false);
    setSelFilamentos((cur) => cur.includes(fid) ? cur.filter((x) => x !== fid) : [...cur, fid]);
  };

  if (!p) return <p style={{ color: "var(--c-text-3)" }}>Cargando…</p>;

  const estado = p.es_vendida ? "Vendida" : p.publicado ? "En catálogo" : "Borrador";

  return (
    <div style={{ width: "100%", maxWidth: 1200 }}>
      {/* Barra superior */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => navigate("/app/piezas")} style={S.ghost}>← Piezas</button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input value={p.nombre || ""} onChange={(e) => set("nombre")(e.target.value)}
            style={{ ...S.input, fontSize: 18, fontWeight: 700 }} placeholder="Nombre de la pieza" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 999, color: "var(--c-text-2)", background: "var(--c-hover)" }}>{estado}</span>
        <span style={{ fontSize: 12, color: "var(--c-text-3)", minWidth: 74, textAlign: "right" }}>
          {saving ? "Guardando…" : saved ? "Guardado ✓" : "Autoguardado"}
        </span>
        <button onClick={() => { dirty.current = false; save(); }} disabled={saving} style={S.primary}>Guardar</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--c-border-med)", marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tab, ...(tab === t.id ? S.tabOn : {}) }}>{t.label}</button>
        ))}
      </div>

      {/* Cálculo — misma calculadora que Precios (multi-parte) */}
      {tab === "calculo" && <PartsCalculator config={pcfg} />}

      {/* General (incluye lo de Catálogo) */}
      {tab === "general" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div style={S.card}>
            <Field label="Descripción">
              <textarea value={p.descripcion || ""} onChange={(e) => set("descripcion")(e.target.value)} rows={4} style={{ ...S.input, resize: "vertical" }} />
            </Field>
            <div style={{ marginTop: 14 }}>
              <FileUpload label="Foto preview" image accept="image/*" value={p.foto_preview_url}
                uploader={viernesApi.uploadImagen} onDone={set("foto_preview_url")} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Field label="Slug (URL pública)"><input value={p.slug || ""} onChange={(e) => set("slug")(e.target.value)} style={S.input} placeholder="se genera solo del nombre" /></Field>
            </div>
            <div style={{ marginTop: 14 }}>
              <FileUpload label="Archivo 3D (3mf)" accept=".3mf,.stl" value={p.archivo_3d_url}
                uploader={viernesApi.uploadArchivo3D} onDone={set("archivo_3d_url")} />
            </div>
          </div>

          <div style={S.card}>
            <span style={S.lbl}>Estado</span>
            <Toggle label="Publicar en catálogo" hint="Visible en el sitio público de Sodigic." on={!!p.publicado} onChange={set("publicado")} />
            <Toggle label="Marcar como vendida" hint="Se registra como pieza vendida." on={!!p.es_vendida} onChange={set("es_vendida")} />
            <Toggle label="Activo" on={p.activo !== false} onChange={set("activo")} />

            <div className="grid grid-cols-2 gap-3" style={{ borderTop: "1px solid var(--c-border)", marginTop: 12, paddingTop: 8 }}>
              <Toggle label="Permite multicolor" on={!!p.permite_multicolor} onChange={set("permite_multicolor")} />
              <Field label="Máx. colores"><input type="number" min={1} value={p.max_colores ?? 4} onChange={(e) => set("max_colores")(parseInt(e.target.value) || 1)} style={S.input} /></Field>
            </div>

            <div style={{ marginTop: 14 }}>
              <span style={S.lbl}>Colores disponibles (se muestran en el sitio)</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {filamentos.length === 0 && <span style={{ fontSize: 12, color: "var(--c-text-4)" }}>Sin filamentos. Créalos en Filamentos.</span>}
                {filamentos.map((f) => {
                  const on = selFilamentos.includes(f.id);
                  return (
                    <button key={f.id} type="button" onClick={() => toggleFil(f.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 10px", borderRadius: 999, cursor: "pointer",
                               border: on ? "1px solid var(--c-accent)" : "1px solid var(--c-border-med)",
                               background: on ? "var(--c-accent-bg)" : "transparent", color: on ? "var(--c-accent-text)" : "var(--c-text-3)" }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: f.hex_codigo || "#888" }} />
                      {f.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venta */}
      {tab === "venta" && (
        <div style={S.card}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Field label="Tipo">
              <Select value={p.tipo_venta || "venta_general"} onChange={set("tipo_venta")}
                options={[{ value: "venta_general", label: "Venta general" }, { value: "encargo", label: "Encargo" }]} />
            </Field>
            <Field label="Cliente / persona"><input value={p.persona || ""} onChange={(e) => set("persona")(e.target.value)} style={S.input} /></Field>
            <Field label="Monto pagado ($)"><input type="number" value={p.monto_pagado ?? ""} onChange={(e) => set("monto_pagado")(num(e.target.value))} style={S.input} /></Field>
            <Field label="Fecha de encargo"><input type="date" value={p.fecha_encargo || ""} onChange={(e) => set("fecha_encargo")(e.target.value)} style={S.input} /></Field>
            <Field label="Fecha de entrega"><input type="date" value={p.fecha_entrega || ""} onChange={(e) => set("fecha_entrega")(e.target.value)} style={S.input} /></Field>
            <Field label="Fecha de pago"><input type="date" value={p.fecha_pago || ""} onChange={(e) => set("fecha_pago")(e.target.value)} style={S.input} /></Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="Notas de venta"><textarea value={p.notas_venta || ""} onChange={(e) => set("notas_venta")(e.target.value)} rows={3} style={{ ...S.input, resize: "vertical" }} /></Field>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 16 },
  lbl: { fontSize: 11, fontWeight: 600, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.04em" },
  input: { padding: "8px 11px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", width: "100%", outline: "none" },
  ghost: { fontSize: 13, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
  primary: { fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--c-accent)", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" },
  tab: { padding: "8px 14px", fontSize: 14, fontWeight: 500, color: "var(--c-text-3)", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", marginBottom: -1 },
  tabOn: { color: "var(--c-accent-text)", borderBottomColor: "var(--c-accent)" },
};
