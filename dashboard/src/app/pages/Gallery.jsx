import { useState, useEffect, useRef } from "react";
import { viernesApi } from "@/lib/apis/viernes";
import { deriveKey, encryptFile, decryptFile } from "@/lib/crypto";

function getMime(item) {
  const ext = (item.filename.split(".").pop() || "").toLowerCase();
  const map = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
    mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
    mkv: "video/x-matroska", avi: "video/x-msvideo", m4v: "video/mp4",
  };
  return map[ext] || (item.media_type === "video" ? "video/mp4" : "image/jpeg");
}

async function fetchAndDecrypt(item, aesKey) {
  const res = await viernesApi.galleryFile(item.id);
  if (!res.ok) {
    const text = await res.text().catch(() => res.status);
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const encBuf = await res.arrayBuffer();
  const decBuf = await decryptFile(aesKey, encBuf);
  return URL.createObjectURL(new Blob([decBuf], { type: getMime(item) }));
}

// Module-level key cache — survives navigation without storing in localStorage
let _sessionKey = null;

const QUESTIONS = [
  "¡Hola! ¿Cómo estás hoy?",
  "¿Qué tal te ha ido?",
  "¿Cómo amaneciste?",
  "¿Cómo va el día?",
  "¿Todo bien por ahí?",
  "¿Qué me cuentas hoy?",
  "¿Cómo te fue?",
  "¡Buenas! ¿Cómo estás?",
  "¿Qué tal tu mañana?",
  "¿Cómo va todo por allá?",
];

// ─── Tag Input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange, suggestions = [] }) {
  const [input, setInput] = useState("");
  const [showSug, setShowSug] = useState(false);
  const ref = useRef(null);

  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  function add(tag) {
    const t = tag.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
    setShowSug(false);
    ref.current?.focus();
  }

  function onKey(e) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) { e.preventDefault(); add(input); }
    if (e.key === "Backspace" && !input && tags.length > 0) onChange(tags.slice(0, -1));
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-lg p-2 min-h-[40px] cursor-text relative"
      style={{ background: "var(--c-input-bg, var(--c-hover))", border: "1px solid var(--c-border)" }}
      onClick={() => ref.current?.focus()}
    >
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: "rgba(139,92,246,0.18)", color: "#c4b5fd" }}>
          {t}
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(tags.filter(x => x !== t)); }} className="opacity-60 hover:opacity-100">×</button>
        </span>
      ))}
      <div className="relative flex-1 min-w-[100px]">
        <input ref={ref} value={input}
          onChange={(e) => { setInput(e.target.value); setShowSug(true); }}
          onKeyDown={onKey}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          placeholder={tags.length === 0 ? "Etiqueta + Enter" : ""}
          className="w-full bg-transparent outline-none text-sm"
          style={{ color: "var(--c-text)" }}
        />
        {showSug && filtered.length > 0 && (
          <div className="absolute left-0 top-full mt-1 rounded-lg overflow-hidden z-10 min-w-[140px]"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
            {filtered.slice(0, 8).map((s) => (
              <button key={s} type="button" onMouseDown={() => add(s)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--c-hover)] transition-colors"
                style={{ color: "var(--c-text-2)" }}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ open, onClose, onUploaded, allTags, aesKey }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState("");
  const [tags, setTags] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) { setFile(null); setPreview(null); setName(""); setTags([]); setError(""); }
  }, [open]);

  useEffect(() => {
    if (open?.file) pickFile(open.file);
  }, [open]);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setName((prev) => prev || f.name.replace(/\.[^.]+$/, ""));
    setPreview({ url: URL.createObjectURL(f), type: f.type.startsWith("video") ? "video" : "image" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo"); return; }
    setUploading(true);
    setError("");
    try {
      const buf = await file.arrayBuffer();
      const encBuf = await encryptFile(aesKey, buf);
      const encBlob = new Blob([encBuf], { type: "application/octet-stream" });
      const suffix = file.name.match(/\.[^.]+$/)?.[0] || ".bin";
      const fd = new FormData();
      fd.append("file", encBlob, `enc${suffix}`);
      fd.append("display_name", name.trim());
      fd.append("media_type", preview.type);
      fd.append("tags", JSON.stringify(tags));
      const item = await viernesApi.galleryUpload(fd);
      onUploaded(item);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  const inputStyle = {
    background: "var(--c-input-bg, var(--c-hover))", color: "var(--c-text)",
    border: "1px solid var(--c-border)", borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem", fontSize: "0.875rem", width: "100%", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--c-text)" }}>Agregar a visitas</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--c-hover)]" style={{ color: "var(--c-text-4)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            className="rounded-xl relative overflow-hidden cursor-pointer transition-colors"
            style={{
              minHeight: preview ? "auto" : "130px",
              border: `2px dashed ${dragging ? "var(--c-accent)" : "var(--c-border-med)"}`,
              background: dragging ? "rgba(139,92,246,0.07)" : "var(--c-hover)",
            }}
            onClick={() => !preview && fileRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
          >
            {preview ? (
              <div style={{ pointerEvents: "none" }}>
                {preview.type === "video"
                  ? <video src={preview.url} className="w-full max-h-56 object-contain rounded-xl" style={{ pointerEvents: "auto" }} controls />
                  : <img src={preview.url} className="w-full max-h-56 object-contain rounded-xl" alt="preview" />
                }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6" style={{ pointerEvents: "none" }}>
                <svg className="mb-2 opacity-40" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <p className="text-xs" style={{ color: dragging ? "var(--c-accent)" : "var(--c-text-4)" }}>
                  {dragging ? "Suelta aquí" : "Clic, arrastra o Ctrl+V"}
                </p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files[0])} />
          {preview && <button type="button" onClick={() => { setFile(null); setPreview(null); setName(""); }} className="text-xs" style={{ color: "var(--c-text-4)" }}>Cambiar archivo</button>}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>Nombre</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del archivo" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>Etiquetas</label>
            <TagInput tags={tags} onChange={setTags} suggestions={allTags} />
          </div>
          {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--c-hover)]"
              style={{ color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}>Cancelar</button>
            <button type="submit" disabled={uploading} className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-85"
              style={{ background: "var(--c-accent)", color: "#fff" }}>{uploading ? "Cifrando y subiendo…" : "Subir"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onSaved, allTags }) {
  const [name, setName] = useState(item.display_name);
  const [tags, setTags] = useState(item.tags || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputStyle = {
    background: "var(--c-input-bg, var(--c-hover))", color: "var(--c-text)",
    border: "1px solid var(--c-border)", borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem", fontSize: "0.875rem", width: "100%", outline: "none",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await viernesApi.galleryUpdate(item.id, { display_name: name, tags });
      onSaved(updated);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl shadow-2xl"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--c-text)" }}>Editar</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--c-hover)]" style={{ color: "var(--c-text-4)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>Nombre</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>Etiquetas</label>
            <TagInput tags={tags} onChange={setTags} suggestions={allTags} />
          </div>
          {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--c-hover)]"
              style={{ color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}>Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-85"
              style={{ background: "var(--c-accent)", color: "#fff" }}>{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Media Card (with lazy decrypt) ──────────────────────────────────────────
function MediaCard({ item, aesKey, onClick, onEdit, onDelete, deleting }) {
  const [src, setSrc] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    (async () => {
      try {
        objectUrl = await fetchAndDecrypt(item, aesKey);
        setSrc(objectUrl);
      } catch (e) {
        console.error("[Gallery] decrypt failed:", item.id, e.message);
        setSrc("error");
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, aesKey]);

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", aspectRatio: "1" }}
      onMouseEnter={() => { setHovered(true); setShowActions(true); }}
      onMouseLeave={() => { setHovered(false); setShowActions(false); }}
      onClick={onClick}
    >
      {!src ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--c-accent)", borderTopColor: "transparent" }} />
        </div>
      ) : src === "error" ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--c-text-4)" }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[10px] text-center" style={{ color: "var(--c-text-4)" }}>No se pudo descifrar</p>
        </div>
      ) : item.media_type === "video" ? (
        <>
          <video src={src} className="w-full h-full object-cover" preload="metadata" muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </>
      ) : (
        <img src={src} className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: hovered ? "scale(1.04)" : "scale(1)" }} alt={item.display_name} loading="lazy" />
      )}

      <div className="absolute inset-0 flex flex-col justify-end p-2 transition-opacity duration-200"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)", opacity: hovered ? 1 : 0 }}>
        <p className="text-xs font-medium text-white truncate">{item.display_name || item.filename}</p>
        {item.tags?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[9px] px-1 py-0.5 rounded-full"
                style={{ background: "rgba(139,92,246,0.5)", color: "#e9d5ff" }}>{t}</span>
            ))}
            {item.tags.length > 2 && (
              <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
                +{item.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-1 transition-opacity duration-150"
        style={{ opacity: showActions ? 1 : 0, pointerEvents: showActions ? "auto" : "none" }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg text-white" style={{ background: "rgba(0,0,0,0.6)" }} title="Editar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={deleting}
          className="p-1.5 rounded-lg text-white disabled:opacity-50"
          style={{ background: "rgba(239,68,68,0.7)" }} title="Eliminar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ items, index, aesKey, onClose, onNext, onPrev }) {
  const item = items[index];
  const [src, setSrc] = useState(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    setSrc(null);
    let objectUrl = null;
    (async () => {
      try {
        objectUrl = await fetchAndDecrypt(item, aesKey);
        setSrc(objectUrl);
      } catch (e) {
        console.error("[Gallery] lightbox decrypt failed:", item.id, e.message);
        setSrc("error");
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, aesKey]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.95)" }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) { dx < 0 ? onNext() : onPrev(); }
        touchStartX.current = null;
      }}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div>
          <p className="text-sm font-medium text-white">{item.display_name || item.filename}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.tags?.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(139,92,246,0.3)", color: "#c4b5fd" }}>{t}</span>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-white opacity-70 hover:opacity-100 hover:bg-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-14">
        {!src ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#a78bfa", borderTopColor: "transparent" }} />
            <p className="text-xs text-white/40">Descifrando…</p>
          </div>
        ) : src === "error" ? (
          <p className="text-white/40 text-sm">Error al descifrar</p>
        ) : item.media_type === "video" ? (
          <video key={src} src={src} className="max-w-full max-h-full rounded-xl" controls autoPlay />
        ) : (
          <img key={src} src={src} className="max-w-full max-h-full object-contain rounded-xl" alt={item.display_name} />
        )}

        {index > 0 && (
          <button onClick={onPrev} className="absolute left-2 p-3 rounded-full text-white hover:bg-white/15"
            style={{ background: "rgba(0,0,0,0.4)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        {index < items.length - 1 && (
          <button onClick={onNext} className="absolute right-2 p-3 rounded-full text-white hover:bg-white/15"
            style={{ background: "rgba(0,0,0,0.4)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>

      <div className="flex-shrink-0 py-3 text-center">
        <span className="text-xs text-white/40">{index + 1} / {items.length}</span>
      </div>
    </div>
  );
}

// ─── Passphrase Challenge ─────────────────────────────────────────────────────
function PassphraseChallenge({ onUnlocked }) {
  const [question] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const [answer, setAnswer] = useState("");
  const [messages, setMessages] = useState([{ from: "bot", text: null }]);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Show question after brief delay for natural feel
    const t = setTimeout(() => {
      setMessages([{ from: "bot", text: question }]);
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(t);
  }, [question]);

  async function send(e) {
    e.preventDefault();
    if (!answer.trim() || checking) return;
    const typed = answer.trim();
    setAnswer("");
    setMessages((m) => [...m, { from: "user", text: typed }]);
    setChecking(true);

    try {
      const res = await viernesApi.galleryVerify({ passphrase: typed });
      if (res.ok) {
        setMessages((m) => [...m, { from: "bot", text: "¡Perfecto! Un momento…" }]);
        const key = await deriveKey(typed, res.kdf_salt);
        _sessionKey = key;
        setTimeout(() => onUnlocked(key), 800);
      } else {
        const n = res.today_visits ?? 0;
        const decoy = `Señor, el día de hoy han visitado el sitio ${n} ${n === 1 ? "persona" : "personas"}.`;
        setMessages((m) => [...m, { from: "bot", text: decoy }]);
        setTimeout(() => {
          const next = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
          setMessages((m) => [...m, { from: "bot", text: next }]);
          inputRef.current?.focus();
        }, 1800);
      }
    } catch (err) {
      setMessages((m) => [...m, { from: "bot", text: "Ocurrió un error, intenta de nuevo." }]);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--c-bg)" }}>
      <div className="px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border-med)", background: "var(--c-shell)" }}>
        <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>Visitas</h1>
      </div>

      <div className="flex-1 flex flex-col justify-end max-w-lg mx-auto w-full px-6 py-6 gap-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.text === null ? (
              <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: "var(--c-card)", border: "1px solid var(--c-border)" }}>
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--c-text-4)", animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            ) : (
              <div
                className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                style={msg.from === "bot"
                  ? { background: "var(--c-card)", color: "var(--c-text-2)", border: "1px solid var(--c-border)" }
                  : { background: "var(--c-accent)", color: "#fff" }
                }
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 px-6 py-4 max-w-lg mx-auto w-full flex-shrink-0"
        style={{ borderTop: "1px solid var(--c-border)" }}>
        <input
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribe tu respuesta…"
          disabled={checking}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{ background: "var(--c-input-bg, var(--c-hover))", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
        />
        <button type="submit" disabled={!answer.trim() || checking}
          className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 hover:opacity-85 transition-opacity"
          style={{ background: "var(--c-accent)", color: "#fff" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ onSetup }) {
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (passphrase.length < 3) { setError("Mínimo 3 caracteres"); return; }
    if (passphrase !== confirm) { setError("Las frases no coinciden"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await viernesApi.gallerySetup({ passphrase });
      const key = await deriveKey(passphrase, res.kdf_salt);
      _sessionKey = key;
      onSetup(key);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const inputStyle = {
    background: "var(--c-input-bg, var(--c-hover))", color: "var(--c-text)",
    border: "1px solid var(--c-border)", borderRadius: "0.75rem",
    padding: "0.625rem 0.875rem", fontSize: "0.875rem", width: "100%", outline: "none",
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6" style={{ background: "var(--c-bg)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>Configurar acceso a Visitas</h1>
          <p className="text-sm mt-1" style={{ color: "var(--c-text-3)" }}>
            Define la frase clave. Los archivos se cifrarán con ella y solo tú podrás verlos.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>Frase clave</label>
            <input style={inputStyle} type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Mínimo 3 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>Confirmar frase clave</label>
            <input style={inputStyle} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la frase" />
          </div>
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(139,92,246,0.08)", color: "#a78bfa" }}>
            ⚠️ Si pierdes esta frase no podrás recuperar los archivos — el servidor nunca la conoce.
          </p>
          {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:opacity-85"
            style={{ background: "var(--c-accent)", color: "#fff" }}>
            {saving ? "Configurando…" : "Activar cifrado"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Gallery View (unlocked) ──────────────────────────────────────────────────
function GalleryView({ aesKey }) {
  const [items, setItems] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [tagFilter, setTagFilter] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, tags] = await Promise.all([viernesApi.galleryList(), viernesApi.galleryTags()]);
        setItems(data);
        setAllTags(tags);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    function onPaste(e) {
      const file = e.clipboardData?.files?.[0];
      if (file?.type.startsWith("image/")) setUploadModal({ file });
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const filtered = items.filter((item) => {
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      if (!item.display_name.toLowerCase().includes(q) && !item.filename.toLowerCase().includes(q)) return false;
    }
    if (tagFilter.length > 0) {
      const lower = (item.tags || []).map((t) => t.toLowerCase());
      if (!tagFilter.every((t) => lower.includes(t.toLowerCase()))) return false;
    }
    return true;
  });

  function toggleTag(tag) {
    setTagFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function handleUploaded(item) {
    setItems((prev) => [item, ...prev]);
    const newTags = (item.tags || []).filter((t) => !allTags.includes(t));
    if (newTags.length > 0) setAllTags((prev) => [...prev, ...newTags].sort());
  }

  function handleSaved(updated) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await viernesApi.galleryDelete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) { alert("Error: " + e.message); }
    finally { setDeleting(null); setConfirmDelete(null); }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--c-bg)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-border-med)", background: "var(--c-shell)" }}>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>Visitas</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--c-text-4)" }}>
            {items.length} {items.length === 1 ? "archivo" : "archivos"} · cifrados
          </p>
        </div>
        <button onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-85"
          style={{ background: "var(--c-accent)", color: "#fff" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 flex-shrink-0 space-y-2" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Buscar por nombre…"
          className="w-full max-w-sm rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--c-input-bg, var(--c-hover))", color: "var(--c-text)", border: "1px solid var(--c-border)" }} />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs self-center mr-1" style={{ color: "var(--c-text-3)", fontSize: "0.75rem", fontWeight: 600 }}>Etiquetas:</span>
            {allTags.map((t) => {
              const active = tagFilter.includes(t);
              return (
                <button key={t} onClick={() => toggleTag(t)}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all"
                  style={active ? { background: "var(--c-accent)", color: "#fff" } : { background: "var(--c-hover-2)", color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}>
                  {t}
                </button>
              );
            })}
            {tagFilter.length > 0 && (
              <button onClick={() => setTagFilter([])} className="text-xs px-2 py-0.5" style={{ color: "var(--c-text-4)" }}>Limpiar</button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-center py-20 text-sm" style={{ color: "var(--c-text-4)" }}>Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" style={{ color: "var(--c-text-4)" }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm" style={{ color: "var(--c-text-4)" }}>
              {items.length === 0 ? "Agrega archivos con el botón o pega con Ctrl+V." : "Sin resultados."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
            {filtered.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                aesKey={aesKey}
                onClick={() => setLightboxIndex(filtered.indexOf(item))}
                onEdit={() => setEditItem(item)}
                onDelete={() => setConfirmDelete(item.id)}
                deleting={deleting === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          index={lightboxIndex}
          aesKey={aesKey}
          onClose={() => setLightboxIndex(null)}
          onNext={() => setLightboxIndex((i) => Math.min(i + 1, filtered.length - 1))}
          onPrev={() => setLightboxIndex((i) => Math.max(i - 1, 0))}
        />
      )}

      <UploadModal open={uploadModal} onClose={() => setUploadModal(false)} onUploaded={handleUploaded} allTags={allTags} aesKey={aesKey} />
      {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} onSaved={handleSaved} allTags={allTags} />}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-xs rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-2" style={{ color: "var(--c-text)" }}>Eliminar archivo</h3>
            <p className="text-sm mb-6" style={{ color: "var(--c-text-3)" }}>Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl text-sm font-medium hover:bg-[var(--c-hover)]"
                style={{ border: "1px solid var(--c-border-med)", color: "var(--c-text-2)" }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deleting}
                className="flex-1 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Gallery() {
  const [phase, setPhase] = useState("loading"); // loading | setup | locked | unlocked
  const [aesKey, setAesKey] = useState(_sessionKey);

  useEffect(() => {
    if (_sessionKey) { setPhase("unlocked"); return; }
    (async () => {
      try {
        const { configured } = await viernesApi.galleryConfig();
        setPhase(configured ? "locked" : "setup");
      } catch {
        setPhase("locked");
      }
    })();
  }, []);

  if (phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: "var(--c-bg)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--c-accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (phase === "setup") {
    return <SetupScreen onSetup={(key) => { setAesKey(key); setPhase("unlocked"); }} />;
  }

  if (phase === "locked") {
    return <PassphraseChallenge onUnlocked={(key) => { setAesKey(key); setPhase("unlocked"); }} />;
  }

  return <GalleryView aesKey={aesKey} />;
}
