import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { viernesApi } from "@/lib/apis/viernes";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const EMPTY_FORM = {
  nombre: "",
  fotos: [],
  precios: [],
  monto_pagado: "",
  persona: "",
  tipo: "venta_general",
  fecha_encargo: "",
  fecha_impresion: "",
  fecha_entrega: "",
  fecha_pago: "",
  filamento: "",
  tiempo_impresion: "",
  notas: "",
  archivos: [],
};

const EXT_ICONS = {
  stl:  { color: "#60a5fa", label: "STL"  },
  "3mf":{ color: "#a78bfa", label: "3MF"  },
  obj:  { color: "#34d399", label: "OBJ"  },
  gcode:{ color: "#fbbf24", label: "GCODE"},
  step: { color: "#f87171", label: "STEP" },
  stp:  { color: "#f87171", label: "STEP" },
  iges: { color: "#fb923c", label: "IGES" },
  igs:  { color: "#fb923c", label: "IGES" },
  amf:  { color: "#e879f9", label: "AMF"  },
};

function extOf(nombre) {
  return (nombre || "").split(".").pop().toLowerCase();
}

// ── Archivos 3D editor ────────────────────────────────────────────────────────
function ArchivosEditor({ archivos, onChange }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files) {
    if (!files?.length) return;
    setUploading(true);
    const added = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await viernesApi.uploadArchivo3D(fd);
        if (res?.url) added.push({ url: res.url, nombre: res.nombre_original || file.name });
      } catch (e) {
        alert("Error subiendo archivo: " + e.message);
      }
    }
    onChange([...archivos, ...added]);
    setUploading(false);
  }

  function remove(i) { onChange(archivos.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-2">
      {archivos.map((a, i) => {
        const ext = extOf(a.nombre);
        const meta = EXT_ICONS[ext] || { color: "var(--c-text-4)", label: ext.toUpperCase() };
        return (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: meta.color + "22", color: meta.color }}>{meta.label}</span>
            <span className="flex-1 text-sm truncate" style={{ color: "var(--c-text-2)" }}>{a.nombre}</span>
            <button type="button" onClick={() => remove(i)} className="p-1 rounded transition-all" style={{ color: "var(--c-text-4)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-text-4)"; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        );
      })}
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all"
        style={{ background: "var(--c-hover)", border: "1px dashed var(--c-border-med)", color: "var(--c-text-3)" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--c-accent)"; e.currentTarget.style.color = "var(--c-text)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--c-border-med)"; e.currentTarget.style.color = "var(--c-text-3)"; }}
      >
        {uploading ? "Subiendo…" : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {archivos.length === 0 ? "Subir archivo 3D" : "Agregar más archivos"}
          </>
        )}
      </button>
      <p className="text-xs" style={{ color: "var(--c-text-4)" }}>STL · 3MF · OBJ · GCODE · STEP · IGES · AMF — máx 200 MB</p>
      <input ref={fileRef} type="file" accept=".stl,.3mf,.obj,.gcode,.step,.stp,.iges,.igs,.amf" multiple className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

// ── Archivos 3D read-only ─────────────────────────────────────────────────────
function ArchivosReadOnly({ archivos }) {
  if (!archivos?.length) return <p className="text-sm" style={{ color: "var(--c-text-4)" }}>Sin archivos</p>;

  return (
    <div className="space-y-2">
      {archivos.map((a, i) => {
        const ext = extOf(a.nombre);
        const meta = EXT_ICONS[ext] || { color: "var(--c-text-4)", label: ext.toUpperCase() };
        const href = a.url.startsWith("/") ? `${API_BASE}${a.url}` : a.url;
        return (
          <a key={i} href={href} download={a.nombre} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
            style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--c-accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--c-border)"; }}
          >
            <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: meta.color + "22", color: meta.color }}>{meta.label}</span>
            <span className="flex-1 text-sm truncate" style={{ color: "var(--c-text-2)" }}>{a.nombre}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--c-text-4)", flexShrink: 0 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>
        );
      })}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ReadValue({ value, placeholder = "—" }) {
  return (
    <p className="text-sm" style={{ color: value ? "var(--c-text)" : "var(--c-text-4)" }}>
      {value || placeholder}
    </p>
  );
}

function StyledInput({ value, onChange, type = "text", placeholder = "" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={{
        background: "var(--c-hover)",
        border: "1px solid var(--c-border-med)",
        color: "var(--c-text)",
      }}
      onFocus={(e) => { e.target.style.borderColor = "var(--c-accent)"; }}
      onBlur={(e) => { e.target.style.borderColor = "var(--c-border-med)"; }}
    />
  );
}

function StyledTextarea({ value, onChange, placeholder = "", rows = 3 }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all"
      style={{
        background: "var(--c-hover)",
        border: "1px solid var(--c-border-med)",
        color: "var(--c-text)",
      }}
      onFocus={(e) => { e.target.style.borderColor = "var(--c-accent)"; }}
      onBlur={(e) => { e.target.style.borderColor = "var(--c-border-med)"; }}
    />
  );
}

function StyledSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={{
        background: "var(--c-hover)",
        border: "1px solid var(--c-border-med)",
        color: "var(--c-text)",
      }}
      onFocus={(e) => { e.target.style.borderColor = "var(--c-accent)"; }}
      onBlur={(e) => { e.target.style.borderColor = "var(--c-border-med)"; }}
    >
      {options.map(({ value: v, label }) => (
        <option key={v} value={v} style={{ background: "var(--c-shell)" }}>{label}</option>
      ))}
    </select>
  );
}

// ── Precios dinámicos ──────────────────────────────────────────────────────────
function PreciosEditor({ precios, onChange }) {
  function update(i, val) {
    const copy = [...precios];
    copy[i] = val === "" ? "" : Number(val);
    onChange(copy);
  }
  function add() { onChange([...precios, ""]); }
  function remove(i) { onChange(precios.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-2">
      {precios.map((p, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-xs" style={{ color: "var(--c-text-4)", minWidth: "20px" }}>#{i + 1}</span>
          <input
            type="number"
            value={p}
            onChange={(e) => update(i, e.target.value)}
            placeholder="0.00"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "var(--c-hover)",
              border: "1px solid var(--c-border-med)",
              color: "var(--c-text)",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--c-accent)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--c-border-med)"; }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "var(--c-text-4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-text-4)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
        style={{ color: "var(--c-accent)", background: "rgba(var(--accent-rgb, 99,102,241),0.1)" }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Agregar precio
      </button>
    </div>
  );
}

// ── Fotos ─────────────────────────────────────────────────────────────────────
function FotosEditor({ fotos, onChange }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files) {
    if (!files?.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await viernesApi.uploadImagen(fd);
        if (res?.url) newUrls.push(res.url);
      } catch (e) {
        alert("Error subiendo imagen: " + e.message);
      }
    }
    onChange([...fotos, ...newUrls]);
    setUploading(false);
  }

  function removePhoto(i) {
    onChange(fotos.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      {/* Grid de fotos */}
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url.startsWith("/") ? `${API_BASE}${url}` : url}
                alt={`foto ${i + 1}`}
                className="w-24 h-24 object-cover rounded-xl"
                style={{ border: "1px solid var(--c-border-med)" }}
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: "#f87171", color: "#fff" }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-all"
        style={{
          background: "var(--c-hover)",
          border: "1px dashed var(--c-border-med)",
          color: "var(--c-text-3)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--c-accent)"; e.currentTarget.style.color = "var(--c-text)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--c-border-med)"; e.currentTarget.style.color = "var(--c-text-3)"; }}
      >
        {uploading ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Subiendo…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {fotos.length === 0 ? "Agregar fotos" : "Agregar más fotos"}
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}

// ── Vista de fotos (read-only) ────────────────────────────────────────────────
function FotosReadOnly({ fotos }) {
  const [lightbox, setLightbox] = useState(null);
  if (!fotos?.length) return <p className="text-sm" style={{ color: "var(--c-text-4)" }}>Sin fotos</p>;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {fotos.map((url, i) => (
          <img
            key={i}
            src={url.startsWith("/") ? `${API_BASE}${url}` : url}
            alt={`foto ${i + 1}`}
            onClick={() => setLightbox(url)}
            className="w-24 h-24 object-cover rounded-xl cursor-pointer transition-transform hover:scale-105"
            style={{ border: "1px solid var(--c-border-med)" }}
          />
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.startsWith("/") ? `${API_BASE}${lightbox}` : lightbox}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
            alt="foto ampliada"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PiezaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "nueva";

  const [form, setForm] = useState(EMPTY_FORM);
  const [original, setOriginal] = useState(null);
  const [editMode, setEditMode] = useState(isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncOk, setSyncOk] = useState(false);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    viernesApi.getPieza(id)
      .then((data) => {
        const mapped = {
          nombre: data.nombre ?? "",
          fotos: data.fotos ?? [],
          precios: data.precios ?? [],
          monto_pagado: data.monto_pagado != null ? String(data.monto_pagado) : "",
          persona: data.persona ?? "",
          tipo: data.tipo ?? "venta_general",
          fecha_encargo: data.fecha_encargo ?? "",
          fecha_impresion: data.fecha_impresion ?? "",
          fecha_entrega: data.fecha_entrega ?? "",
          fecha_pago: data.fecha_pago ?? "",
          filamento: data.filamento ?? "",
          tiempo_impresion: data.tiempo_impresion ?? "",
          notas: data.notas ?? "",
          archivos: data.archivos ?? [],
          sincronizado_sodigic: data.sincronizado_sodigic,
        };
        setForm(mapped);
        setOriginal(mapped);
        setSyncOk(data.sincronizado_sodigic);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function setField(key) {
    return (val) => setForm((f) => ({ ...f, [key]: val }));
  }

  function buildPayload() {
    return {
      nombre: form.nombre,
      fotos: form.fotos.length ? form.fotos : null,
      precios: form.precios.filter((p) => p !== "").map(Number).length ? form.precios.filter((p) => p !== "").map(Number) : null,
      monto_pagado: form.monto_pagado !== "" ? Number(form.monto_pagado) : null,
      persona: form.persona || null,
      tipo: form.tipo,
      fecha_encargo: form.fecha_encargo || null,
      fecha_impresion: form.fecha_impresion || null,
      fecha_entrega: form.fecha_entrega || null,
      fecha_pago: form.fecha_pago || null,
      filamento: form.filamento || null,
      tiempo_impresion: form.tiempo_impresion || null,
      notas: form.notas || null,
      archivos: form.archivos.length ? form.archivos : null,
    };
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        const created = await viernesApi.createPieza(buildPayload());
        navigate(`/app/piezas/${created.id}`, { replace: true });
      } else {
        const updated = await viernesApi.updatePieza(id, buildPayload());
        const mapped = {
          nombre: updated.nombre ?? "",
          fotos: updated.fotos ?? [],
          precios: updated.precios ?? [],
          monto_pagado: updated.monto_pagado != null ? String(updated.monto_pagado) : "",
          persona: updated.persona ?? "",
          tipo: updated.tipo ?? "venta_general",
          fecha_encargo: updated.fecha_encargo ?? "",
          fecha_impresion: updated.fecha_impresion ?? "",
          fecha_entrega: updated.fecha_entrega ?? "",
          fecha_pago: updated.fecha_pago ?? "",
          filamento: updated.filamento ?? "",
          tiempo_impresion: updated.tiempo_impresion ?? "",
          notas: updated.notas ?? "",
          archivos: updated.archivos ?? [],
          sincronizado_sodigic: updated.sincronizado_sodigic,
        };
        setForm(mapped);
        setOriginal(mapped);
        setSyncOk(updated.sincronizado_sodigic);
        setEditMode(false);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (isNew) { navigate("/app/piezas"); return; }
    setForm(original);
    setEditMode(false);
    setError("");
  }

  async function handleSync() {
    setSyncing(true);
    setError("");
    try {
      await viernesApi.syncPiezaSodigic(id);
      setSyncOk(true);
      setForm((f) => ({ ...f, sincronizado_sodigic: true }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-center py-16" style={{ color: "var(--c-text-4)" }}>Cargando pieza…</div>
    );
  }

  const readOnly = !editMode;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/app/piezas")}
          className="p-2 rounded-xl transition-all"
          style={{ color: "var(--c-text-4)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "var(--c-text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "var(--c-text-4)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold truncate" style={{ color: "var(--c-text)" }}>
            {isNew ? "Nueva pieza" : (form.nombre || "Detalle de pieza")}
          </h1>
          {!isNew && (
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-4)" }}>
              {readOnly ? "Solo lectura" : "Modo edición"}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {!isNew && !editMode && (
            <>
              {!syncOk && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    color: "#4ade80",
                    border: "1px solid rgba(34,197,94,0.25)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  {syncing ? "Sincronizando…" : "Sincronizar con Sodigic"}
                </button>
              )}
              {syncOk && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Sincronizado con Sodigic
                </span>
              )}
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--c-accent)", color: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>
            </>
          )}

          {editMode && (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--c-hover)", color: "var(--c-text-2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-hover-2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--c-hover)"; }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--c-accent)", color: "#fff" }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm px-4 py-2 rounded-xl" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
          {error}
        </p>
      )}

      {/* Card principal */}
      <div className="rounded-2xl p-6 space-y-6" style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)" }}>

        {/* Nombre */}
        <Field label="Nombre de la pieza">
          {readOnly
            ? <ReadValue value={form.nombre} />
            : <StyledInput value={form.nombre} onChange={setField("nombre")} placeholder="Ej: Soporte de monitor" />
          }
        </Field>

        {/* Fotos */}
        <Field label="Fotos">
          {readOnly
            ? <FotosReadOnly fotos={form.fotos} />
            : <FotosEditor fotos={form.fotos} onChange={setField("fotos")} />
          }
        </Field>

        {/* Tipo + Persona */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Tipo de venta">
            {readOnly
              ? <ReadValue value={form.tipo === "encargo" ? "Encargo" : "Venta general"} />
              : <StyledSelect
                  value={form.tipo}
                  onChange={setField("tipo")}
                  options={[
                    { value: "venta_general", label: "Venta general" },
                    { value: "encargo", label: "Encargo" },
                  ]}
                />
            }
          </Field>
          <Field label="Cliente / Persona">
            {readOnly
              ? <ReadValue value={form.persona} />
              : <StyledInput value={form.persona} onChange={setField("persona")} placeholder="Nombre de la persona" />
            }
          </Field>
        </div>

        <hr style={{ borderColor: "var(--c-border)" }} />

        {/* Precios individuales */}
        <Field label="Precio por pieza (si hay varias)">
          {readOnly
            ? form.precios?.length
              ? <div className="flex flex-wrap gap-2">
                  {form.precios.map((p, i) => (
                    <span key={i} className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--c-hover-2)", color: "var(--c-text)" }}>
                      #{i + 1} — ${Number(p).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </span>
                  ))}
                </div>
              : <ReadValue value={null} />
            : <PreciosEditor precios={form.precios} onChange={setField("precios")} />
          }
        </Field>

        {/* Monto pagado total */}
        <Field label="Monto total cobrado">
          {readOnly
            ? <ReadValue value={form.monto_pagado !== "" ? `$${Number(form.monto_pagado).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : null} />
            : <StyledInput type="number" value={form.monto_pagado} onChange={setField("monto_pagado")} placeholder="0.00" />
          }
        </Field>

        <hr style={{ borderColor: "var(--c-border)" }} />

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Fecha de encargo">
            {readOnly
              ? <ReadValue value={form.fecha_encargo} />
              : <StyledInput type="date" value={form.fecha_encargo} onChange={setField("fecha_encargo")} />
            }
          </Field>
          <Field label="Fecha de impresión">
            {readOnly
              ? <ReadValue value={form.fecha_impresion} />
              : <StyledInput type="date" value={form.fecha_impresion} onChange={setField("fecha_impresion")} />
            }
          </Field>
          <Field label="Fecha de entrega">
            {readOnly
              ? <ReadValue value={form.fecha_entrega} />
              : <StyledInput type="date" value={form.fecha_entrega} onChange={setField("fecha_entrega")} />
            }
          </Field>
          <Field label="Fecha de pago">
            {readOnly
              ? <ReadValue value={form.fecha_pago} />
              : <StyledInput type="date" value={form.fecha_pago} onChange={setField("fecha_pago")} />
            }
          </Field>
        </div>

        <hr style={{ borderColor: "var(--c-border)" }} />

        {/* Impresión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Filamento usado">
            {readOnly
              ? <ReadValue value={form.filamento} />
              : <StyledInput value={form.filamento} onChange={setField("filamento")} placeholder="Ej: PLA Negro 1.75mm" />
            }
          </Field>
          <Field label="Tiempo de impresión">
            {readOnly
              ? <ReadValue value={form.tiempo_impresion} />
              : <StyledInput value={form.tiempo_impresion} onChange={setField("tiempo_impresion")} placeholder="Ej: 4h 30m" />
            }
          </Field>
        </div>

        {/* Archivos 3D */}
        <hr style={{ borderColor: "var(--c-border)" }} />

        <Field label="Archivos 3D (STL, 3MF, OBJ, GCODE…)">
          {readOnly
            ? <ArchivosReadOnly archivos={form.archivos} />
            : <ArchivosEditor archivos={form.archivos} onChange={setField("archivos")} />
          }
        </Field>

        {/* Notas */}
        <Field label="Notas">
          {readOnly
            ? <ReadValue value={form.notas} />
            : <StyledTextarea value={form.notas} onChange={setField("notas")} placeholder="Observaciones, detalles del encargo, etc." rows={4} />
          }
        </Field>
      </div>
    </div>
  );
}
