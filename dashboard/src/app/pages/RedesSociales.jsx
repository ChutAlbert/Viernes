import { useState, useEffect } from "react";
import { viernesApi } from "@/lib/apis/viernes";

const ICONOS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X (Twitter)" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "telegram", label: "Telegram" },
  { value: "website", label: "Sitio web" },
];

const EMPTY = { nombre: "", url: "", icono: "instagram", orden: 0, activo: true };

function IconSvg({ icono, size = 18 }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor" };
  if (icono === "instagram") return <svg {...props}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
  if (icono === "facebook") return <svg {...props}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  if (icono === "whatsapp") return <svg {...props}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  if (icono === "tiktok") return <svg {...props}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;
  if (icono === "x") return <svg {...props}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>;
  if (icono === "youtube") return <svg {...props}><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>;
  if (icono === "linkedin") return <svg {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  if (icono === "telegram") return <svg {...props}><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
  // website / default
  return <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}

export default function RedesSociales() {
  const [redes, setRedes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    try { setRedes(await viernesApi.listRedes()); } catch (e) { setError(e.message); }
  }

  function startEdit(red) {
    setEditId(red.id);
    setForm({ nombre: red.nombre, url: red.url, icono: red.icono, orden: red.orden, activo: red.activo });
  }

  function cancelEdit() { setEditId(null); setForm(EMPTY); setError(""); }

  async function save() {
    if (!form.nombre.trim() || !form.url.trim()) { setError("Nombre y URL son requeridos."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, orden: parseInt(form.orden) || 0 };
      if (editId) await viernesApi.updateRed(editId, payload);
      else await viernesApi.createRed(payload);
      await load();
      cancelEdit();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("¿Eliminar esta red social?")) return;
    try { await viernesApi.deleteRed(id); await load(); }
    catch (e) { setError(e.message); }
  }

  const inputCls = "px-3 py-2 rounded-lg text-sm outline-none w-full";
  const inputStyle = { background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>Redes Sociales</h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-4)" }}>Se muestran en el website (contacto y footer).</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>{error}</div>}

      {/* Formulario */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
          {editId ? "Editar red social" : "Nueva red social"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Red / Nombre</label>
            <input className={inputCls} style={inputStyle} value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Instagram" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Ícono</label>
            <select className={inputCls} style={inputStyle} value={form.icono}
              onChange={e => setForm(p => ({ ...p, icono: e.target.value }))}>
              {ICONOS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>URL</label>
            <input className={inputCls} style={inputStyle} value={form.url}
              onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://instagram.com/sodigic" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Orden</label>
            <input type="number" className={inputCls} style={inputStyle} value={form.orden}
              onChange={e => setForm(p => ({ ...p, orden: e.target.value }))} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--c-text-2)" }}>
              <input type="checkbox" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} />
              Activo (visible en website)
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--c-accent)", color: "#fff" }}>
            {saving ? "Guardando…" : editId ? "Guardar cambios" : "Agregar"}
          </button>
          {editId && <button onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--c-text-3)" }}>Cancelar</button>}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {redes.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--c-text-4)" }}>No hay redes sociales. Agrega la primera.</p>}
        {redes.map(red => (
          <div key={red.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--c-hover-2)", color: "var(--c-text-2)" }}>
              <IconSvg icono={red.icono} size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{red.nombre}</p>
              <p className="text-xs truncate" style={{ color: "var(--c-text-4)" }}>{red.url}</p>
            </div>
            {!red.activo && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>Inactiva</span>}
            <span className="text-xs" style={{ color: "var(--c-text-4)" }}>#{red.orden}</span>
            <button onClick={() => startEdit(red)} className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "var(--c-hover)", color: "var(--c-text-3)" }}>Editar</button>
            <button onClick={() => remove(red.id)} className="text-xs" style={{ color: "#f87171" }}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
