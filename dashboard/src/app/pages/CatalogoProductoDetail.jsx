import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { viernesApi } from "@/lib/apis/viernes";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  archivo_3d_url: "",
  foto_preview_url: "",
  tiempo_horas: "0",
  tiempo_minutos: "0",
  // Calibración de precio con dos puntos del slicer (preferido)
  tiempo_min_horas: "0",
  tiempo_min_minutos: "0",
  tiempo_max_horas: "0",
  tiempo_max_minutos: "0",
  tamano_base_mm: "",   // Ancho (X) — solo usado si no hay calibración
  tamano_y_mm: "",      // Alto  (Y)
  tamano_z_mm: "",      // Largo (Z)
  tamano_minimo_mm: "",
  tamano_maximo_mm: "",
  permite_multicolor: false,
  max_colores: 1,
  activo: true,
  publicado: false,
};

function minutosAHM(totalMinutos) {
  const t = Math.round(Number(totalMinutos) || 0);
  return { horas: String(Math.floor(t / 60)), minutos: String(t % 60) };
}
function HMaMinutos(horas, minutos) {
  return (parseInt(horas) || 0) * 60 + (parseInt(minutos) || 0);
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function Field({ label, hint, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>
        {label}{hint && <span className="ml-1 font-normal opacity-70"> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled, min, max }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    disabled={disabled} min={min} max={max}
    className="px-3 py-2 rounded-lg text-sm outline-none w-full disabled:opacity-50"
    style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }} />;
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    className="px-3 py-2 rounded-lg text-sm outline-none w-full resize-none"
    style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }} />;
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <p className="text-xs font-semibold uppercase tracking-widest flex-shrink-0" style={{ color: "var(--c-text-4)" }}>{children}</p>
      <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
    </div>
  );
}

// ─── Uploader de imagen ───────────────────────────────────────────────────────
function ImagenPreviewUploader({ url, onChange }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const res = await viernesApi.uploadImagen(fd); if (res?.url) onChange(res.url); }
    catch (e) { alert("Error subiendo imagen: " + e.message); }
    finally { setUploading(false); }
  }
  return (
    <div className="flex items-start gap-4">
      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer"
        style={{ background: "var(--c-hover-2)", border: "2px dashed var(--c-border-med)" }} onClick={() => ref.current?.click()}>
        {url ? <img src={`${API_BASE}${url}`} className="w-full h-full object-cover" alt="preview" />
          : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" style={{ color: "var(--c-text-4)" }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text-2)" }}>
          {uploading ? "Subiendo…" : url ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {url && <button onClick={() => onChange("")} className="text-xs" style={{ color: "#f87171" }}>Quitar</button>}
      </div>
    </div>
  );
}

// ─── Uploader de archivo 3D ───────────────────────────────────────────────────
const EXT_COLORS = { stl: "#60a5fa", "3mf": "#a78bfa", obj: "#34d399", gcode: "#fbbf24", step: "#f87171" };
function extOf(name) { return (name || "").split(".").pop().toLowerCase(); }

function Archivo3DUploader({ url, onChange, label = "Archivo 3D principal" }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const filename = url ? url.split("/").pop() : null;
  const ext = extOf(filename || "");
  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try { const fd = new FormData(); fd.append("file", file); const res = await viernesApi.uploadArchivo3D(fd); if (res?.url) onChange(res.url); }
    catch (e) { alert("Error subiendo archivo: " + e.message); }
    finally { setUploading(false); }
  }
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)" }}>
      <input ref={ref} type="file" accept=".stl,.3mf,.obj,.gcode,.step,.stp,.iges,.igs,.amf" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      {filename ? (
        <>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: `${EXT_COLORS[ext] || "#94a3b8"}22`, color: EXT_COLORS[ext] || "#94a3b8" }}>{ext.toUpperCase()}</div>
          <p className="text-xs flex-1 truncate font-medium" style={{ color: "var(--c-text-2)" }}>{filename}</p>
          <button onClick={() => ref.current?.click()} disabled={uploading} className="text-xs px-2 py-1 rounded-lg"
            style={{ background: "var(--c-hover-2)", color: "var(--c-text-3)" }}>{uploading ? "…" : "Cambiar"}</button>
          <button onClick={() => onChange("")} className="text-xs" style={{ color: "#f87171" }}>Quitar</button>
        </>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={uploading} className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--c-text-3)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {uploading ? "Subiendo…" : `Subir ${label}`}
        </button>
      )}
    </div>
  );
}

// ─── Selector de filamentos colapsable por grupo ──────────────────────────────
function FilamentosSelector({ available, selected, onChange }) {
  const grupos = available.reduce((acc, f) => {
    if (!acc[f.tipo_material]) acc[f.tipo_material] = [];
    acc[f.tipo_material].push(f);
    return acc;
  }, {});

  // Grupos expandidos: por defecto solo los que tienen filamentos seleccionados
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    Object.keys(grupos).forEach(t => { init[t] = false; });
    return init;
  });

  // Expandir grupos que tienen seleccionados cuando cambia `selected`
  useEffect(() => {
    if (selected.length === 0) return;
    setExpanded(prev => {
      const next = { ...prev };
      selected.forEach(s => {
        const fil = available.find(f => f.id === s.filamento_id);
        if (fil) next[fil.tipo_material] = true;
      });
      return next;
    });
  }, []);  // solo al montar

  function toggle(filamentoId) {
    const exists = selected.find(s => s.filamento_id === filamentoId);
    if (exists) onChange(selected.filter(s => s.filamento_id !== filamentoId));
    else onChange([...selected, { filamento_id: filamentoId, archivo_3d_url: "" }]);
  }

  function setArchivo(filamentoId, url) {
    onChange(selected.map(s => s.filamento_id === filamentoId ? { ...s, archivo_3d_url: url } : s));
  }

  function toggleGrupo(tipo) {
    setExpanded(prev => ({ ...prev, [tipo]: !prev[tipo] }));
  }

  if (available.length === 0) return (
    <p className="text-xs" style={{ color: "var(--c-text-4)" }}>No hay filamentos. Créalos primero en la pestaña Filamentos.</p>
  );

  return (
    <div className="space-y-2">
      {Object.entries(grupos).map(([tipo, grupo]) => {
        const selCount = grupo.filter(f => selected.find(s => s.filamento_id === f.id)).length;
        const isOpen = expanded[tipo];
        return (
          <div key={tipo} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border-med)" }}>
            {/* Header del grupo */}
            <button
              onClick={() => toggleGrupo(tipo)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ background: selCount > 0 ? "rgba(139,92,246,0.06)" : "var(--c-hover)" }}
            >
              <span className="text-xs font-bold uppercase tracking-widest flex-1" style={{ color: "var(--c-text-3)" }}>{tipo}</span>
              {selCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(139,92,246,0.18)", color: "var(--c-accent)" }}>
                  {selCount} seleccionado{selCount !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-[10px]" style={{ color: "var(--c-text-4)" }}>{grupo.length} colores</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                style={{ color: "var(--c-text-4)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Filamentos del grupo */}
            {isOpen && (
              <div className="divide-y" style={{ borderTop: "1px solid var(--c-border-med)" }}>
                {grupo.map(fil => {
                  const sel = selected.find(s => s.filamento_id === fil.id);
                  return (
                    <div key={fil.id}>
                      <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                        style={{ background: sel ? "rgba(139,92,246,0.05)" : "transparent" }}>
                        <input type="checkbox" checked={!!sel} onChange={() => toggle(fil.id)} />
                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: fil.hex_codigo, border: "1px solid var(--c-border-med)" }} />
                        <span className="text-sm flex-1" style={{ color: "var(--c-text)" }}>{fil.nombre}</span>
                        {!fil.en_stock && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>Sin stock</span>
                        )}
                      </label>
                      {sel && (
                        <div className="px-4 pb-3 pt-1" style={{ background: "rgba(139,92,246,0.04)" }}>
                          <p className="text-[10px] mb-1.5" style={{ color: "var(--c-text-4)" }}>
                            Archivo 3D específico para {fil.nombre} (opcional)
                          </p>
                          <Archivo3DUploader url={sel.archivo_3d_url} onChange={url => setArchivo(fil.id, url)} label={`archivo ${fil.nombre}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function CatalogoProductoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "nuevo";

  const [form, setForm] = useState(EMPTY_FORM);
  const [filamentos, setFilamentos] = useState([]);
  const [selFilamentos, setSelFilamentos] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    viernesApi.listFilamentos().then(setFilamentos).catch(console.error);
  }, []);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    viernesApi.getProductoCatalogo(id)
      .then(p => {
        const { horas, minutos } = minutosAHM(p.tiempo_impresion_minutos);
        const tMin = minutosAHM(p.tiempo_minimo_minutos ?? 0);
        const tMax = minutosAHM(p.tiempo_maximo_minutos ?? 0);
        setForm({
          nombre: p.nombre, descripcion: p.descripcion || "",
          archivo_3d_url: p.archivo_3d_url || "", foto_preview_url: p.foto_preview_url || "",
          tiempo_horas: horas, tiempo_minutos: minutos,
          tiempo_min_horas: tMin.horas, tiempo_min_minutos: tMin.minutos,
          tiempo_max_horas: tMax.horas, tiempo_max_minutos: tMax.minutos,
          tamano_base_mm: String(p.tamano_base_mm),
          tamano_y_mm: p.tamano_y_mm != null ? String(p.tamano_y_mm) : "",
          tamano_z_mm: p.tamano_z_mm != null ? String(p.tamano_z_mm) : "",
          tamano_minimo_mm: String(p.tamano_minimo_mm),
          tamano_maximo_mm: String(p.tamano_maximo_mm),
          permite_multicolor: p.permite_multicolor, max_colores: p.max_colores,
          activo: p.activo, publicado: p.publicado,
        });
        setSelFilamentos(p.filamentos.map(f => ({ filamento_id: f.filamento_id, archivo_3d_url: f.archivo_3d_url || "" })));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const f = field => e => setForm(p => ({ ...p, [field]: e.target.value }));
  const fCheck = field => e => setForm(p => ({ ...p, [field]: e.target.checked }));

  const totalMinutos    = HMaMinutos(form.tiempo_horas, form.tiempo_minutos);
  const totalMinMin     = HMaMinutos(form.tiempo_min_horas, form.tiempo_min_minutos);
  const totalMinMax     = HMaMinutos(form.tiempo_max_horas, form.tiempo_max_minutos);
  const tieneCalibrado  = totalMinMin > 0 && totalMinMax > 0;

  function exportJson() {
    const { tiempo_horas, tiempo_minutos, tiempo_min_horas, tiempo_min_minutos, tiempo_max_horas, tiempo_max_minutos, ...rest } = form;
    const data = {
      ...rest,
      tiempo_impresion_minutos: totalMinutos,
      tiempo_minimo_minutos: tieneCalibrado ? totalMinMin : null,
      tiempo_maximo_minutos: tieneCalibrado ? totalMinMax : null,
      tamano_base_mm: parseFloat(form.tamano_base_mm) || null,
      tamano_y_mm: form.tamano_y_mm !== "" ? parseFloat(form.tamano_y_mm) : null,
      tamano_z_mm: form.tamano_z_mm !== "" ? parseFloat(form.tamano_z_mm) : null,
      tamano_minimo_mm: parseFloat(form.tamano_minimo_mm) || null,
      tamano_maximo_mm: parseFloat(form.tamano_maximo_mm) || null,
      max_colores: parseInt(form.max_colores),
      filamentos: selFilamentos,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `producto_${(form.nombre || "nuevo").replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        const { horas, minutos } = minutosAHM(data.tiempo_impresion_minutos ?? 0);
        const tMin = minutosAHM(data.tiempo_minimo_minutos ?? 0);
        const tMax = minutosAHM(data.tiempo_maximo_minutos ?? 0);
        setForm({
          nombre: data.nombre ?? "",
          descripcion: data.descripcion ?? "",
          archivo_3d_url: data.archivo_3d_url ?? "",
          foto_preview_url: data.foto_preview_url ?? "",
          tiempo_horas: horas, tiempo_minutos: minutos,
          tiempo_min_horas: tMin.horas, tiempo_min_minutos: tMin.minutos,
          tiempo_max_horas: tMax.horas, tiempo_max_minutos: tMax.minutos,
          tamano_base_mm: String(data.tamano_base_mm ?? ""),
          tamano_y_mm: data.tamano_y_mm != null ? String(data.tamano_y_mm) : "",
          tamano_z_mm: data.tamano_z_mm != null ? String(data.tamano_z_mm) : "",
          tamano_minimo_mm: String(data.tamano_minimo_mm ?? ""),
          tamano_maximo_mm: String(data.tamano_maximo_mm ?? ""),
          permite_multicolor: data.permite_multicolor ?? false,
          max_colores: data.max_colores ?? 1,
          activo: data.activo ?? true,
          publicado: data.publicado ?? false,
        });
        if (data.filamentos) setSelFilamentos(data.filamentos);
        setError("");
      } catch { setError("El archivo JSON no es válido."); }
    };
    reader.readAsText(file);
  }

  async function save() {
    setError("");
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
    if (totalMinutos <= 0 || !form.tamano_base_mm || !form.tamano_minimo_mm || !form.tamano_maximo_mm) {
      setError("Completa todos los campos de tiempo y tamaño."); return;
    }
    setSaving(true);
    try {
      const { tiempo_horas, tiempo_minutos, tiempo_min_horas, tiempo_min_minutos, tiempo_max_horas, tiempo_max_minutos, ...rest } = form;
      const payload = {
        ...rest,
        tiempo_impresion_minutos: totalMinutos,
        tiempo_minimo_minutos: tieneCalibrado ? totalMinMin : null,
        tiempo_maximo_minutos: tieneCalibrado ? totalMinMax : null,
        tamano_base_mm: parseFloat(form.tamano_base_mm),
        tamano_y_mm: form.tamano_y_mm !== "" ? parseFloat(form.tamano_y_mm) : null,
        tamano_z_mm: form.tamano_z_mm !== "" ? parseFloat(form.tamano_z_mm) : null,
        tamano_minimo_mm: parseFloat(form.tamano_minimo_mm),
        tamano_maximo_mm: parseFloat(form.tamano_maximo_mm),
        max_colores: parseInt(form.max_colores),
        filamentos: selFilamentos,
      };
      if (isNew) await viernesApi.createProductoCatalogo(payload);
      else await viernesApi.updateProductoCatalogo(id, payload);
      navigate("/app/catalogo");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 text-sm text-center" style={{ color: "var(--c-text-4)" }}>Cargando…</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/catalogo")} className="p-2 rounded-lg transition-all" style={{ color: "var(--c-text-4)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "var(--c-text)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--c-text-4)"; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>{isNew ? "Nuevo producto" : "Editar producto"}</h1>
          <p className="text-sm" style={{ color: "var(--c-text-4)" }}>Catálogo 3D</p>
        </div>
        {/* Export / Import */}
        <label className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
          style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text-3)" }}
          title="Importar desde JSON">
          <input type="file" accept=".json" className="hidden" onChange={e => importJson(e.target.files?.[0])} />
          Importar
        </label>
        <button onClick={exportJson} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text-3)" }}>
          Exportar
        </button>
        {/* Guardar arriba */}
        <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: "var(--c-accent)", color: "#fff" }}>
          {saving ? "Guardando…" : isNew ? "Crear" : "Guardar"}
        </button>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>{error}</div>}

      <div className="rounded-2xl p-6 space-y-6" style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)" }}>

        {/* ── Información básica ── */}
        <SectionTitle>Información básica</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Nombre *" className="lg:col-span-2">
            <Input value={form.nombre} onChange={f("nombre")} placeholder="Ej: Llavero personalizado" />
          </Field>
          <Field label="Descripción" className="lg:col-span-2">
            <Textarea value={form.descripcion} onChange={f("descripcion")} placeholder="Descripción visible en el catálogo…" rows={2} />
          </Field>
        </div>

        {/* ── Archivos ── */}
        <SectionTitle>Archivos</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Field label="Imagen de preview">
            <ImagenPreviewUploader url={form.foto_preview_url} onChange={url => setForm(p => ({ ...p, foto_preview_url: url }))} />
          </Field>
          <Field label="Archivo 3D principal" hint="STL, 3MF, OBJ, etc.">
            <Archivo3DUploader url={form.archivo_3d_url} onChange={url => setForm(p => ({ ...p, archivo_3d_url: url }))} />
          </Field>
        </div>

        {/* ── Impresión y tamaños ── */}
        <SectionTitle>Impresión y tamaños</SectionTitle>

        {/* Tiempo */}
        <Field label="Tiempo de impresión base *" hint="del slicer, a las dimensiones exactas de abajo">
          <div className="flex items-center gap-2 max-w-xs">
            <div className="flex items-center gap-1.5 flex-1">
              <input type="number" min="0" max="99" value={form.tiempo_horas}
                onChange={e => setForm(p => ({ ...p, tiempo_horas: e.target.value }))}
                className="px-3 py-2 rounded-lg text-sm outline-none w-full"
                style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
                placeholder="0" />
              <span className="text-xs shrink-0" style={{ color: "var(--c-text-4)" }}>h</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <input type="number" min="0" max="59" value={form.tiempo_minutos}
                onChange={e => setForm(p => ({ ...p, tiempo_minutos: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)).toString() }))}
                className="px-3 py-2 rounded-lg text-sm outline-none w-full"
                style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
                placeholder="0" />
              <span className="text-xs shrink-0" style={{ color: "var(--c-text-4)" }}>min</span>
            </div>
            {totalMinutos > 0 && (
              <span className="text-xs whitespace-nowrap" style={{ color: "var(--c-text-4)" }}>= {totalMinutos} min</span>
            )}
          </div>
        </Field>

        {/* Dimensiones X Y Z */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--c-text-4)" }}>
            Dimensiones base (mm) <span className="font-normal opacity-70"> — deben coincidir con la pieza en el slicer cuando mediste el tiempo</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Ancho (X) *" hint="referencia de precio">
              <Input type="number" value={form.tamano_base_mm} onChange={f("tamano_base_mm")} placeholder="120" />
            </Field>
            <Field label="Largo (Y)" hint="opcional">
              <Input type="number" value={form.tamano_y_mm} onChange={f("tamano_y_mm")} placeholder="160" />
            </Field>
            <Field label="Alto (Z)" hint="altura de impresión">
              <Input type="number" value={form.tamano_z_mm} onChange={f("tamano_z_mm")} placeholder="110" />
            </Field>
          </div>
          {(form.tamano_base_mm || form.tamano_y_mm || form.tamano_z_mm) && (
            <p className="text-xs mt-2" style={{ color: "var(--c-text-4)" }}>
              Vista en web: {[
                form.tamano_base_mm && `${(parseFloat(form.tamano_base_mm) / 10).toFixed(1)} cm`,
                form.tamano_y_mm    && `${(parseFloat(form.tamano_y_mm)    / 10).toFixed(1)} cm`,
                form.tamano_z_mm    && `${(parseFloat(form.tamano_z_mm)    / 10).toFixed(1)} cm`,
              ].filter(Boolean).join(" × ")}
            </p>
          )}
          {totalMinutos > 0 && form.tamano_base_mm && (
            <div className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--c-accent)", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="text-xs" style={{ color: "var(--c-text-3)" }}>
                A tamaño base ({(parseFloat(form.tamano_base_mm)/10).toFixed(1)} cm), el slicer debe mostrar exactamente <strong>{totalMinutos} min</strong>. Si difiere, corrige las dimensiones base.
              </p>
            </div>
          )}
        </div>

        {/* Rango de escala + calibración */}
        <div className="rounded-xl p-4 space-y-4" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-accent)" }}>
            Calibración de precios con slicer <span className="font-normal normal-case tracking-normal opacity-70 ml-1">— recomendado</span>
          </p>
          <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
            Pon la pieza en el slicer a <strong>3 tamaños</strong>: mínimo, base (el de arriba) y máximo. El algoritmo usa los 3 puntos para calcular una curva exacta por tramos para esta pieza.
          </p>

          {/* Tamaño mínimo + su tiempo */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <Field label="Tamaño mínimo (X, mm) *" hint="slider izquierdo">
              <Input type="number" value={form.tamano_minimo_mm} onChange={f("tamano_minimo_mm")} placeholder="40" />
            </Field>
            <Field label="Tiempo a ese tamaño (del slicer)">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <input type="number" min="0" max="99" value={form.tiempo_min_horas}
                    onChange={e => setForm(p => ({ ...p, tiempo_min_horas: e.target.value }))}
                    className="px-3 py-2 rounded-lg text-sm outline-none w-full"
                    style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
                    placeholder="0" />
                  <span className="text-xs shrink-0" style={{ color: "var(--c-text-4)" }}>h</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <input type="number" min="0" max="59" value={form.tiempo_min_minutos}
                    onChange={e => setForm(p => ({ ...p, tiempo_min_minutos: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)).toString() }))}
                    className="px-3 py-2 rounded-lg text-sm outline-none w-full"
                    style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
                    placeholder="0" />
                  <span className="text-xs shrink-0" style={{ color: "var(--c-text-4)" }}>min</span>
                </div>
                {totalMinMin > 0 && <span className="text-xs whitespace-nowrap" style={{ color: "var(--c-text-4)" }}>= {totalMinMin} min</span>}
              </div>
            </Field>
          </div>

          {/* Tamaño máximo + su tiempo */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <Field label="Tamaño máximo (X, mm) *" hint="slider derecho">
              <Input type="number" value={form.tamano_maximo_mm} onChange={f("tamano_maximo_mm")} placeholder="200" />
            </Field>
            <Field label="Tiempo a ese tamaño (del slicer)">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <input type="number" min="0" max="99" value={form.tiempo_max_horas}
                    onChange={e => setForm(p => ({ ...p, tiempo_max_horas: e.target.value }))}
                    className="px-3 py-2 rounded-lg text-sm outline-none w-full"
                    style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
                    placeholder="0" />
                  <span className="text-xs shrink-0" style={{ color: "var(--c-text-4)" }}>h</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <input type="number" min="0" max="59" value={form.tiempo_max_minutos}
                    onChange={e => setForm(p => ({ ...p, tiempo_max_minutos: Math.min(59, Math.max(0, parseInt(e.target.value) || 0)).toString() }))}
                    className="px-3 py-2 rounded-lg text-sm outline-none w-full"
                    style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
                    placeholder="0" />
                  <span className="text-xs shrink-0" style={{ color: "var(--c-text-4)" }}>min</span>
                </div>
                {totalMinMax > 0 && <span className="text-xs whitespace-nowrap" style={{ color: "var(--c-text-4)" }}>= {totalMinMax} min</span>}
              </div>
            </Field>
          </div>

          {tieneCalibrado && (
            <div className="flex items-center gap-2 pt-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "#34d399", flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
              <p className="text-xs" style={{ color: "#34d399" }}>
                Calibrado: {totalMinMin} min a {(parseFloat(form.tamano_minimo_mm||"0")/10).toFixed(1)} cm → {totalMinMax} min a {(parseFloat(form.tamano_maximo_mm||"0")/10).toFixed(1)} cm
              </p>
            </div>
          )}
        </div>

        {/* ── Filamentos ── */}
        <SectionTitle>Filamentos disponibles</SectionTitle>
        <FilamentosSelector available={filamentos} selected={selFilamentos} onChange={setSelFilamentos} />

        {/* ── Multicolor ── */}
        <SectionTitle>Multicolor</SectionTitle>
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--c-hover)", border: "1px solid var(--c-border-med)", opacity: 0.6 }}>
          <label className="flex items-center gap-2 text-sm font-medium cursor-not-allowed" style={{ color: "var(--c-text-3)" }}>
            <input type="checkbox" checked={form.permite_multicolor} onChange={fCheck("permite_multicolor")} disabled />
            Permitir multicolor en este producto
          </label>
          <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
            Deshabilitado globalmente hasta tener la impresora. Aplica ×1.5 al precio final cuando esté activo.
          </p>
        </div>

        {/* ── Visibilidad ── */}
        <SectionTitle>Visibilidad</SectionTitle>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--c-text-2)" }}>
            <input type="checkbox" checked={form.activo} onChange={fCheck("activo")} /> Activo
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--c-text-2)" }}>
            <input type="checkbox" checked={form.publicado} onChange={fCheck("publicado")} /> Publicado en el website
          </label>
        </div>

        {/* ── Acciones ── */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => navigate("/app/catalogo")} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: "var(--c-text-3)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}>Cancelar</button>
          <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--c-accent)", color: "#fff" }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            {saving ? "Guardando…" : isNew ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
