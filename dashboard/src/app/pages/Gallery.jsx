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

// Decryption cache — id → blobUrl (or "error"), never revoked while session is active
const _decryptCache = new Map();
// Pending promises — prevents duplicate concurrent decryptions for the same item
const _decryptPending = new Map();

// Processes one decryption at a time; priority items jump to the front
class DecryptQueue {
  constructor(concurrency = 1) {
    this._c = concurrency; this._running = 0;
    this._normal = []; this._priority = [];
  }
  add(fn, priority = false) {
    return new Promise((resolve, reject) => {
      (priority ? this._priority : this._normal).push({ fn, resolve, reject });
      this._run();
    });
  }
  _run() {
    while (this._running < this._c && (this._priority.length || this._normal.length)) {
      const t = this._priority.length ? this._priority.shift() : this._normal.shift();
      this._running++;
      t.fn().then(t.resolve, t.reject).finally(() => { this._running--; this._run(); });
    }
  }
}
const _decryptQueue = new DecryptQueue(1);

async function fetchAndDecryptQueued(item, aesKey, priority = false) {
  if (_decryptCache.has(item.id)) {
    const v = _decryptCache.get(item.id);
    if (v === "error") throw new Error("cached error");
    return v;
  }
  if (_decryptPending.has(item.id)) return _decryptPending.get(item.id);
  const promise = _decryptQueue
    .add(() => fetchAndDecrypt(item, aesKey), priority)
    .then((url) => { _decryptCache.set(item.id, url); _decryptPending.delete(item.id); return url; })
    .catch((e) => { _decryptCache.set(item.id, "error"); _decryptPending.delete(item.id); throw e; });
  _decryptPending.set(item.id, promise);
  return promise;
}

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
const MAX_VIDEOS = 2;
const MAX_IMAGES = 5;

function UploadModal({ open, onClose, onUploaded, allTags, aesKey }) {
  const [files, setFiles] = useState([]); // [{ file, previewUrl, type }]
  const [tags, setTags] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total }
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setFiles((prev) => { prev.forEach((f) => URL.revokeObjectURL(f.previewUrl)); return []; });
      setTags([]); setError(""); setProgress(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open?.file) return;
    const f = open.file;
    const type = f.type.startsWith("video") ? "video" : "image";
    setFiles((prev) => {
      const videos = prev.filter((x) => x.type === "video").length;
      const images = prev.filter((x) => x.type === "image").length;
      if (type === "video" && videos >= MAX_VIDEOS) return prev;
      if (type === "image" && images >= MAX_IMAGES) return prev;
      return [...prev, { file: f, previewUrl: URL.createObjectURL(f), type }];
    });
  }, [open]);

  function addFiles(newFiles) {
    let err = "";
    const toAdd = [];
    setFiles((prev) => {
      let videos = prev.filter((f) => f.type === "video").length;
      let images = prev.filter((f) => f.type === "image").length;
      for (const f of newFiles) {
        const type = f.type.startsWith("video") ? "video" : "image";
        if (type === "video" && videos >= MAX_VIDEOS) { err = `Máximo ${MAX_VIDEOS} videos a la vez`; continue; }
        if (type === "image" && images >= MAX_IMAGES) { err = `Máximo ${MAX_IMAGES} fotos a la vez`; continue; }
        toAdd.push({ file: f, previewUrl: URL.createObjectURL(f), type });
        if (type === "video") videos++; else images++;
      }
      return [...prev, ...toAdd];
    });
    if (err) setError(err);
  }

  function removeFile(index) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (files.length === 0) { setError("Selecciona al menos un archivo"); return; }
    setUploading(true); setError("");
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      const { file, type } = files[i];
      try {
        const buf = await file.arrayBuffer();
        const encBuf = await encryptFile(aesKey, buf);
        const encBlob = new Blob([encBuf], { type: "application/octet-stream" });
        const suffix = file.name.match(/\.[^.]+$/)?.[0] || ".bin";
        const fd = new FormData();
        fd.append("file", encBlob, `enc${suffix}`);
        fd.append("display_name", type === "video" ? "video" : "foto");
        fd.append("media_type", type);
        fd.append("tags", JSON.stringify(tags));
        const item = await viernesApi.galleryUpload(fd);
        onUploaded(item);
      } catch (err) {
        setError(`Error en archivo ${i + 1}: ${err.message}`);
        setUploading(false); setProgress(null); return;
      }
    }
    onClose();
    setUploading(false); setProgress(null);
  }

  if (!open) return null;

  const videoCount = files.filter((f) => f.type === "video").length;
  const imageCount = files.filter((f) => f.type === "image").length;
  const limitReached = videoCount >= MAX_VIDEOS && imageCount >= MAX_IMAGES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)", maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--c-text)" }}>Agregar a visitas</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-4)" }}>
              Máx. {MAX_VIDEOS} videos · {MAX_IMAGES} fotos
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--c-hover)]" style={{ color: "var(--c-text-4)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Drop zone */}
          {!limitReached && (
            <div
              className="rounded-xl cursor-pointer transition-colors flex flex-col items-center justify-center p-5"
              style={{
                minHeight: "90px",
                border: `2px dashed ${dragging ? "var(--c-accent)" : "var(--c-border-med)"}`,
                background: dragging ? "rgba(139,92,246,0.07)" : "var(--c-hover)",
              }}
              onClick={() => fileRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
            >
              <svg className="mb-1.5 opacity-40" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="text-xs" style={{ color: dragging ? "var(--c-accent)" : "var(--c-text-4)" }}>
                {dragging ? "Suelta aquí" : "Clic o arrastra archivos"}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--c-text-4)" }}>
                {videoCount}/{MAX_VIDEOS} videos · {imageCount}/{MAX_IMAGES} fotos
              </p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={(e) => { addFiles(Array.from(e.target.files)); e.target.value = ""; }} />

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg p-2"
                  style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}>
                  {f.type === "video" ? (
                    <video src={f.previewUrl} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" muted />
                  ) : (
                    <img src={f.previewUrl} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--c-text)" }}>
                      {f.type === "video" ? "video" : "foto"}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: "var(--c-text-4)" }}>{f.file.name}</p>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} disabled={uploading}
                    className="p-1 rounded-lg flex-shrink-0 hover:bg-[var(--c-hover-2)] disabled:opacity-40"
                    style={{ color: "var(--c-text-4)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--c-text-3)" }}>
              Etiquetas{files.length > 1 ? " (para todos)" : ""}
            </label>
            <TagInput tags={tags} onChange={setTags} suggestions={allTags} />
          </div>

          {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={uploading}
              className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--c-hover)] disabled:opacity-40"
              style={{ color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}>Cancelar</button>
            <button type="submit" disabled={uploading || files.length === 0}
              className="px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-85"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              {uploading
                ? `Subiendo ${progress?.current}/${progress?.total}…`
                : `Subir ${files.length > 0 ? `${files.length} ` : ""}archivo${files.length !== 1 ? "s" : ""}`}
            </button>
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
function MediaCard({ item, aesKey, onClick, onEdit, onDelete, deleting, shouldLoad }) {
  const [src, setSrc] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!shouldLoad) return;
    let cancelled = false;
    if (retryCount > 0) {
      _decryptCache.delete(item.id);
      _decryptPending.delete(item.id);
    }
    setSrc(null);
    (async () => {
      try {
        const url = await fetchAndDecryptQueued(item, aesKey, retryCount > 0);
        if (!cancelled) setSrc(url);
      } catch (e) {
        console.error("[Gallery] decrypt failed:", item.id, e.message);
        if (!cancelled) setSrc("error");
      }
    })();
    return () => { cancelled = true; };
  }, [item.id, aesKey, retryCount, shouldLoad]);

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", aspectRatio: "1" }}
      onMouseEnter={() => { setHovered(true); setShowActions(true); }}
      onMouseLeave={() => { setHovered(false); setShowActions(false); }}
      onClick={onClick}
    >
      {!shouldLoad ? (
        <div className="w-full h-full" style={{ background: "var(--c-hover)" }} />
      ) : !src ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--c-accent)", borderTopColor: "transparent" }} />
        </div>
      ) : src === "error" ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: "var(--c-text-4)" }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[10px] text-center" style={{ color: "var(--c-text-4)" }}>No se pudo descifrar</p>
          <button
            onClick={(e) => { e.stopPropagation(); setRetryCount((c) => c + 1); }}
            className="text-[10px] px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
            style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}
          >
            Reintentar
          </button>
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
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const [lbRetryKey, setLbRetryKey] = useState(0);
  const lbRetryForId = useRef(null);

  function handleLbRetry() {
    lbRetryForId.current = item.id;
    _decryptCache.delete(item.id);
    _decryptPending.delete(item.id);
    setSrc(null);
    setLbRetryKey((k) => k + 1);
  }

  useEffect(() => {
    setPos({ x: 0, y: 0 });
    const isRetry = lbRetryForId.current === item.id;
    lbRetryForId.current = null;
    if (!isRetry) {
      const cached = _decryptCache.get(item.id);
      if (cached && cached !== "error") { setSrc(cached); return; }
    }
    setSrc(null);
    let cancelled = false;
    (async () => {
      try {
        const url = await fetchAndDecryptQueued(item, aesKey, true);
        if (!cancelled) setSrc(url);
      } catch (e) {
        console.error("[Gallery] lightbox decrypt failed:", item.id, e.message);
        if (!cancelled) setSrc("error");
      }
    })();
    return () => { cancelled = true; };
  }, [item.id, aesKey, lbRetryKey]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNext, onPrev]);

  // Drag logic for video
  const startDrag = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.95)" }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) { dx < 0 ? onNext() : onPrev(); }
        touchStartX.current = null;
      }}>

      {/* Header */}
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

      {/* Content — no side padding, buttons overlay */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {!src ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#a78bfa", borderTopColor: "transparent" }} />
            <p className="text-xs text-white/40">Descifrando…</p>
          </div>
        ) : src === "error" ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/40 text-sm">Error al descifrar</p>
            <button
              onClick={handleLbRetry}
              className="px-4 py-1.5 rounded-lg text-sm hover:opacity-80 transition-opacity"
              style={{ background: "rgba(139,92,246,0.25)", color: "#c4b5fd" }}
            >
              Reintentar
            </button>
          </div>
        ) : item.media_type === "video" ? (
          /* Draggable video wrapper */
          <div
            className="relative"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              transition: dragging ? "none" : "transform 0.12s ease",
              maxWidth: "100%", maxHeight: "100%",
            }}
          >
            {/* Drag handle */}
            <div
              onMouseDown={startDrag}
              className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1 rounded-t-xl z-10 select-none"
              style={{ height: "28px", background: "rgba(0,0,0,0.45)", cursor: dragging ? "grabbing" : "grab" }}
              title="Arrastrar"
            >
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
              ))}
            </div>
            <video
              key={src} src={src}
              className="block rounded-xl"
              style={{ maxWidth: "min(90vw, 900px)", maxHeight: "calc(100vh - 180px)" }}
              controls autoPlay loop
            />
          </div>
        ) : (
          <img key={src} src={src}
            className="object-contain rounded-xl"
            style={{ maxWidth: "min(96vw, 1200px)", maxHeight: "calc(100vh - 160px)" }}
            alt={item.display_name} />
        )}

        {/* Prev — smaller */}
        {index > 0 && (
          <button onClick={onPrev}
            className="absolute left-2 p-1.5 rounded-full text-white transition-opacity opacity-60 hover:opacity-100"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        {/* Next — smaller */}
        {index < items.length - 1 && (
          <button onClick={onNext}
            className="absolute right-2 p-1.5 rounded-full text-white transition-opacity opacity-60 hover:opacity-100"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
  const [filterSelected, setFilterSelected] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [tagFilter, setTagFilter] = useState([]);
  const [sortOrder, setSortOrder] = useState("oldest");   // "oldest" | "newest"
  const [mediaType, setMediaType] = useState("all");      // "all" | "image" | "video"
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIds, setShuffledIds] = useState([]);
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

  // Base: name + tag + media type filters
  const baseFiltered = items.filter((item) => {
    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      if (!item.display_name.toLowerCase().includes(q) && !item.filename.toLowerCase().includes(q)) return false;
    }
    if (tagFilter.length > 0) {
      const lower = (item.tags || []).map((t) => t.toLowerCase());
      if (!tagFilter.every((t) => lower.includes(t.toLowerCase()))) return false;
    }
    if (mediaType !== "all" && item.media_type !== mediaType) return false;
    return true;
  });

  // Apply sort or shuffle on top
  let filtered;
  if (isShuffled) {
    const idMap = Object.fromEntries(baseFiltered.map((i) => [i.id, i]));
    filtered = shuffledIds.map((id) => idMap[id]).filter(Boolean);
    const known = new Set(shuffledIds);
    baseFiltered.forEach((i) => { if (!known.has(i.id)) filtered.push(i); });
  } else {
    filtered = [...baseFiltered].sort((a, b) => {
      const da = new Date(a.created_at), db = new Date(b.created_at);
      return sortOrder === "oldest" ? da - db : db - da;
    });
  }

  function toggleTag(tag) {
    setTagFilter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    setFilterSelected(true);
  }

  function handleShuffle() {
    if (isShuffled) {
      setIsShuffled(false);
      setShuffledIds([]);
    } else {
      const arr = [...baseFiltered.map((i) => i.id)];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledIds(arr);
      setIsShuffled(true);
      setFilterSelected(true);
    }
  }

  function clearAllFilters() {
    setNameFilter(""); setTagFilter([]); setSortOrder("oldest");
    setMediaType("all"); setIsShuffled(false); setShuffledIds([]);
    setFilterSelected(false);
  }

  const hasActiveFilters = nameFilter || tagFilter.length > 0 || mediaType !== "all" || sortOrder !== "oldest" || isShuffled;

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
      // Clean up cached URL for this item
      const cached = _decryptCache.get(id);
      if (cached && cached !== "error") URL.revokeObjectURL(cached);
      _decryptCache.delete(id);
      _decryptPending.delete(id);
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
      <div className="px-6 py-3 flex-shrink-0 space-y-2.5" style={{ borderBottom: "1px solid var(--c-border)" }}>

        {/* Row 1: search + clear */}
        <div className="flex items-center gap-2">
          <input value={nameFilter} onChange={(e) => { setNameFilter(e.target.value); setFilterSelected(true); }}
            placeholder="Buscar por nombre…"
            className="flex-1 max-w-sm rounded-lg px-3 py-1.5 text-sm outline-none"
            style={{ background: "var(--c-input-bg, var(--c-hover))", color: "var(--c-text)", border: "1px solid var(--c-border)" }} />
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--c-text-4)", border: "1px solid var(--c-border)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#f87171"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-4)"}>
              Limpiar todo
            </button>
          )}
        </div>

        {/* Row 2: sort + media type + shuffle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
            {[["oldest", "Primeros"], ["newest", "Recientes"]].map(([val, lbl]) => (
              <button key={val} onClick={() => { setSortOrder(val); setIsShuffled(false); setShuffledIds([]); setFilterSelected(true); }}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={sortOrder === val && !isShuffled
                  ? { background: "var(--c-accent)", color: "#fff" }
                  : { background: "var(--c-hover)", color: "var(--c-text-4)" }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Media type */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
            {[["all", "Todos"], ["image", "Fotos"], ["video", "Videos"]].map(([val, lbl]) => (
              <button key={val} onClick={() => { setMediaType(val); setFilterSelected(true); }}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={mediaType === val
                  ? { background: "var(--c-hover-2)", color: "var(--c-text)", borderBottom: "2px solid var(--c-accent)" }
                  : { background: "var(--c-hover)", color: "var(--c-text-4)", borderBottom: "2px solid transparent" }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Shuffle */}
          <button onClick={handleShuffle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style={isShuffled
              ? { background: "var(--c-accent)", color: "#fff" }
              : { background: "var(--c-hover)", border: "1px solid var(--c-border)", color: "var(--c-text-4)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
            {isShuffled ? "Aleatorio activo" : "Aleatorio"}
          </button>

          {/* count */}
          <span className="text-xs ml-auto" style={{ color: "var(--c-text-4)" }}>
            {filtered.length} {filtered.length === 1 ? "archivo" : "archivos"}
          </span>
        </div>

        {/* Row 3: tag chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Tags:</span>
            {allTags.map((t) => {
              const active = tagFilter.includes(t);
              return (
                <button key={t} onClick={() => toggleTag(t)}
                  className="px-2 py-0.5 rounded-full text-xs font-medium transition-all"
                  style={active ? { background: "var(--c-accent)", color: "#fff" } : { background: "var(--c-hover-2)", color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}>
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-center py-20 text-sm" style={{ color: "var(--c-text-4)" }}>Cargando…</p>
        ) : !filterSelected ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: "var(--c-text-4)" }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm text-center" style={{ color: "var(--c-text-4)" }}>
              {items.length === 0
                ? "Agrega archivos con el botón o pega con Ctrl+V."
                : "Selecciona un filtro para ver el contenido."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" style={{ color: "var(--c-text-4)" }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm" style={{ color: "var(--c-text-4)" }}>Sin resultados.</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
            {filtered.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                aesKey={aesKey}
                shouldLoad={filterSelected}
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
    (async () => {
      if (_sessionKey) { setPhase("unlocked"); return; }
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
