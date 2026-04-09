import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Surface, Button, Input, Textarea, Label, SearchSelect, FileInput } from "@viernes/ui/react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("viernes_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: authHeaders(), ...options });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const ICONS = ["code", "printer", "layout", "lightbulb", "globe", "database"].map((v) => ({ value: v, label: v }));
const CATEGORIES = ["software", "hardware", "design", "consulting", "general"].map((v) => ({ value: v, label: v }));

function ImageUploadInput({ value, onChange }) {
  async function handleFiles(files) {
    const uploaded = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("viernes_token");
      const res = await fetch(`${API}/images/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        uploaded.push(`${API}${data.url}`);
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
  }

  return (
    <div className="space-y-2">
      <FileInput variant="dark" multiple accept=".jpg,.jpeg,.png,.webp,.gif" size="sm" onChange={handleFiles} />
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((url, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm" style={{ border: "1px solid var(--c-border)", background: "var(--c-input-bg)", color: "var(--c-text-2)" }}>
              <img src={url} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" onError={e => e.target.style.display = "none"} />
              <span className="flex-1 truncate text-xs">{url}</span>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="shrink-0 transition" style={{ color: "var(--c-text-4)" }}
                onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-4)"}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/website/admin/services`)
      .then((list) => {
        const svc = list.find((s) => s.slug === slug || String(s.id) === slug);
        if (!svc) { navigate("/app/website"); return; }
        setService(svc);
        setForm({ ...svc, long_description: svc.long_description ?? "", image_urls: svc.image_urls ?? [] });
      })
      .catch(() => navigate("/app/website"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  async function save() {
    if (!form) return;
    setSaving(true);
    setMsg("");
    try {
      const payload = {
        ...form,
        long_description: form.long_description || null,
        image_urls: form.image_urls?.length ? form.image_urls : null,
      };
      await apiFetch(`/website/admin/services/${service.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMsg("Guardado correctamente.");
    } catch {
      setMsg("Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48" style={{ color: "var(--c-text-4)" }}>
        Cargando...
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/app/website")}
          className="flex items-center gap-1.5 text-sm transition"
          style={{ color: "var(--c-text-3)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--c-text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-3)"}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Website
        </button>
        <span style={{ color: "var(--c-border-med)" }}>/</span>
        <span className="text-sm" style={{ color: "var(--c-text-3)" }}>{service.title}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>{service.title}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-4)" }}>
          Slug: <code className="font-mono">{service.slug}</code>
          {" · "}ID: <code className="font-mono">{service.id}</code>
        </p>
      </div>

      <Surface className="p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Título</Label>
          <Input variant="dark" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Descripción corta</Label>
          <Textarea variant="dark" rows={2} value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Descripción larga (página de detalle)</Label>
          <Textarea variant="dark" rows={5} value={form.long_description} onChange={(v) => setForm((f) => ({ ...f, long_description: v }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Imágenes</Label>
          <ImageUploadInput value={form.image_urls ?? []} onChange={(urls) => setForm((f) => ({ ...f, image_urls: urls }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Icono</Label>
            <SearchSelect variant="dark" value={form.icon} onChange={(v) => setForm((f) => ({ ...f, icon: v }))} options={ICONS} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <SearchSelect variant="dark" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={CATEGORIES} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="space-y-1.5">
            <Label>Orden</Label>
            <Input variant="dark" type="number" value={String(form.order_index)} onChange={(v) => setForm((f) => ({ ...f, order_index: +v }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-cyan-400" />
            <span className="text-sm" style={{ color: "var(--c-text-2)" }}>Activo</span>
          </label>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button text={saving ? "Guardando..." : "Guardar cambios"} onClick={save} disabled={saving} />
          {msg && <span className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</span>}
        </div>
      </Surface>
    </div>
  );
}
