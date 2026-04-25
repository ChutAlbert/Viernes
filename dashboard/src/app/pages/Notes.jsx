import { useState, useEffect, useRef, useCallback } from "react";
import { viernesApi } from "@/lib/apis/viernes";
import { ConfirmModal } from "@viernes/ui/react";

const COLORS = [
  { key: "default", label: "Sin color", swatch: "var(--c-border-med)", bg: "var(--c-shell)",  border: "var(--c-border-med)" },
  { key: "yellow",  label: "Amarillo",  swatch: "#fde047",             bg: "#fefce8",         border: "#fde047" },
  { key: "green",   label: "Verde",     swatch: "#86efac",             bg: "#f0fdf4",         border: "#86efac" },
  { key: "blue",    label: "Azul",      swatch: "#93c5fd",             bg: "#eff6ff",         border: "#93c5fd" },
  { key: "pink",    label: "Rosa",      swatch: "#e879f9",             bg: "#fdf4ff",         border: "#e879f9" },
  { key: "orange",  label: "Naranja",   swatch: "#fb923c",             bg: "#fff7ed",         border: "#fb923c" },
  { key: "red",     label: "Rojo",      swatch: "#fb7185",             bg: "#fff1f2",         border: "#fb7185" },
];

const COLOR_MAP = Object.fromEntries(COLORS.map(c => [c.key, c]));

function colorStyle(key) {
  const c = COLOR_MAP[key] || COLOR_MAP.default;
  return { background: c.bg, border: `1px solid ${c.border}` };
}

function fmt(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

const ICON_PIN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
  </svg>
);
const ICON_PLUS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ICON_TRASH = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const ICON_ATTACH = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const ICON_SEARCH = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const EMPTY_NOTE = { title: "", content: "", color: "default", pinned: false, tags: [] };

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [selected, setSelected] = useState(null); // note object being edited
  const [draft, setDraft] = useState(EMPTY_NOTE);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [confirmNote, setConfirmNote] = useState(null);    // id to delete
  const [confirmAtt, setConfirmAtt] = useState(null);      // filename to delete
  const fileRef = useRef();
  const saveTimer = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setNotes(await viernesApi.listNotes()); }
    catch (e) { setError(e.message); }
  }

  function openNote(note) {
    setSelected(note);
    setDraft({ title: note.title, content: note.content, color: note.color, pinned: note.pinned, tags: [...note.tags] });
    setIsNew(false);
    setError("");
  }

  function newNote() {
    setSelected(null);
    setDraft({ ...EMPTY_NOTE });
    setIsNew(true);
    setError("");
  }

  // Autosave after 800ms of inactivity
  const scheduleSave = useCallback((nextDraft, noteId) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNote(nextDraft, noteId), 800);
  }, []);

  function updateDraft(patch, noteId) {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (!isNew && noteId) scheduleSave(next, noteId);
  }

  async function saveNote(d = draft, noteId = selected?.id) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    setError("");
    try {
      const payload = { title: d.title, content: d.content, color: d.color, pinned: d.pinned, tags: d.tags };
      if (isNew) {
        const created = await viernesApi.createNote(payload);
        setIsNew(false);
        setSelected(created);
        setDraft({ title: created.title, content: created.content, color: created.color, pinned: created.pinned, tags: [...created.tags] });
      } else {
        const updated = await viernesApi.updateNote(noteId, payload);
        setSelected(updated);
        setDraft({ title: updated.title, content: updated.content, color: updated.color, pinned: updated.pinned, tags: [...updated.tags] });
      }
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function deleteNote(id) {
    try {
      await viernesApi.deleteNote(id);
      if (selected?.id === id) { setSelected(null); setIsNew(false); }
      await load();
    } catch (e) { setError(e.message); }
    finally { setConfirmNote(null); }
  }

  async function togglePin(note, e) {
    e.stopPropagation();
    try {
      await viernesApi.updateNote(note.id, { title: note.title, content: note.content, color: note.color, pinned: !note.pinned, tags: note.tags });
      if (selected?.id === note.id) setDraft(d => ({ ...d, pinned: !note.pinned }));
      await load();
    } catch (e) { setError(e.message); }
  }

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file || (!selected && !isNew)) return;
    // must save first if new
    let noteId = selected?.id;
    if (isNew) {
      await saveNote();
      noteId = selected?.id;
    }
    if (!noteId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await viernesApi.uploadNoteAttachment(noteId, fd);
      const updated = await viernesApi.listNotes();
      const refreshed = updated.find(n => n.id === noteId);
      if (refreshed) { setSelected(refreshed); setDraft(d => ({ ...d })); }
      setNotes(updated);
    } catch (e) { setError(e.message); }
    finally { setUploading(false); fileRef.current.value = ""; }
  }

  async function deleteAttachment(filename) {
    if (!selected) return;
    try {
      await viernesApi.deleteNoteAttachment(selected.id, filename);
      setConfirmAtt(null);
      const updated = await viernesApi.listNotes();
      const refreshed = updated.find(n => n.id === selected.id);
      if (refreshed) setSelected(refreshed);
      setNotes(updated);
    } catch (e) { setError(e.message); }
  }

  function addTag(e) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim();
      if (!draft.tags.includes(tag)) {
        const next = { ...draft, tags: [...draft.tags, tag] };
        setDraft(next);
        if (!isNew && selected) scheduleSave(next, selected.id);
      }
      setTagInput("");
    }
  }

  function removeTag(tag) {
    const next = { ...draft, tags: draft.tags.filter(t => t !== tag) };
    setDraft(next);
    if (!isNew && selected) scheduleSave(next, selected.id);
  }

  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q));
  });

  const inputCls = "px-3 py-2 rounded-lg text-sm outline-none w-full";
  const inputStyle = { background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" };

  const isEditing = isNew || selected !== null;

  return (
    <div className="flex h-full" style={{ height: "calc(100vh - 57px)" }}>
      {/* Sidebar: notes list */}
      <div className="flex flex-col w-72 flex-shrink-0 h-full" style={{ borderRight: "1px solid var(--c-border-med)", background: "var(--c-shell)" }}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 space-y-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold" style={{ color: "var(--c-text)" }}>Notas</h1>
            <button onClick={newNote}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              {ICON_PLUS} Nueva
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-4)" }}>{ICON_SEARCH}</span>
            <input className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem" }}
              placeholder="Buscar notas…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {filtered.length === 0 && (
            <p className="text-xs text-center py-10" style={{ color: "var(--c-text-4)" }}>
              {search ? "Sin resultados" : "No hay notas. Crea la primera."}
            </p>
          )}
          {filtered.map(note => {
            const isActive = isNew ? false : selected?.id === note.id;
            const c = COLOR_MAP[note.color] || COLOR_MAP.default;
            const accentBar = note.color !== "default" ? c.swatch : "transparent";
            return (
              <div key={note.id}
                onClick={() => openNote(note)}
                className="rounded-xl overflow-hidden cursor-pointer transition-all relative group flex"
                style={isActive
                  ? { background: "var(--c-hover-2)", border: "1px solid var(--c-accent)" }
                  : { background: "var(--c-hover)", border: "1px solid var(--c-border-med)" }
                }>
                {/* color accent bar */}
                <div className="w-1 flex-shrink-0 rounded-l-xl" style={{ background: accentBar }} />
                <div className="flex-1 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate flex-1" style={{ color: "var(--c-text)" }}>
                    {note.title || <span style={{ color: "var(--c-text-4)", fontStyle: "italic" }}>Sin título</span>}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {note.pinned && <span style={{ color: "var(--c-accent)" }}>{ICON_PIN}</span>}
                    <button onClick={(e) => togglePin(note, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: note.pinned ? "var(--c-accent)" : "var(--c-text-4)" }}
                      title={note.pinned ? "Desfijar" : "Fijar"}>
                      {ICON_PIN}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmNote(note.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#f87171" }}>
                      {ICON_TRASH}
                    </button>
                  </div>
                </div>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text-4)" }}>
                  {note.content || "Vacía"}
                </p>
                <p className="text-[10px] mt-1.5" style={{ color: "var(--c-text-4)" }}>{fmt(note.updated_at)}</p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {note.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--c-hover-2)", color: "var(--c-text-3)" }}>#{t}</span>
                    ))}
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor panel */}
      {isEditing ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--c-border-med)" }}>
            {/* Color picker — color de fondo de la tarjeta */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs mr-1" style={{ color: "var(--c-text-4)" }}>Color:</span>
              {COLORS.map(c => (
                <button key={c.key} title={c.label}
                  onClick={() => updateDraft({ color: c.key }, selected?.id)}
                  className="w-5 h-5 rounded-full transition-all duration-150 hover:scale-110"
                  style={{
                    background: c.swatch,
                    outline: draft.color === c.key ? "2px solid var(--c-accent)" : "2px solid transparent",
                    outlineOffset: "2px",
                    transform: draft.color === c.key ? "scale(1.2)" : undefined,
                  }} />
              ))}
            </div>

            <div className="h-4" style={{ width: "1px", background: "var(--c-border-med)" }} />

            {/* Pin */}
            <button
              onClick={() => updateDraft({ pinned: !draft.pinned }, selected?.id)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
              style={{
                background: draft.pinned ? "var(--c-hover-2)" : "var(--c-hover)",
                color: draft.pinned ? "var(--c-accent)" : "var(--c-text-3)",
              }}>
              {ICON_PIN} {draft.pinned ? "Fijada" : "Fijar"}
            </button>

            {/* Attach file */}
            <button onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-50"
              style={{ background: "var(--c-hover)", color: "var(--c-text-3)" }}>
              {ICON_ATTACH} {uploading ? "Subiendo…" : "Adjuntar"}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} />

            <div className="flex-1" />

            {/* Save status */}
            <span className="text-xs" style={{ color: "var(--c-text-4)" }}>
              {saving ? "Guardando…" : isNew ? "" : "Autosave activo"}
            </span>

            {/* Save button (for new notes or manual) */}
            <button onClick={() => saveNote()}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              {isNew ? "Crear nota" : "Guardar"}
            </button>

            {selected && (
              <button onClick={() => setConfirmNote(selected.id)}
                className="px-2.5 py-1.5 rounded-lg text-xs"
                style={{ color: "#f87171" }}>
                {ICON_TRASH}
              </button>
            )}
          </div>

          {error && (
            <div className="mx-5 mt-3 px-4 py-2 rounded-xl text-sm"
              style={{ background: "rgba(248,113,113,0.12)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              <input
                value={draft.title}
                onChange={e => updateDraft({ title: e.target.value }, selected?.id)}
                placeholder="Título de la nota…"
                className="w-full text-xl font-semibold outline-none bg-transparent"
                style={{ color: "var(--c-text)" }}
              />

              <textarea
                value={draft.content}
                onChange={e => updateDraft({ content: e.target.value }, selected?.id)}
                placeholder="Escribe aquí…"
                className="w-full h-full resize-none outline-none bg-transparent text-sm leading-relaxed"
                style={{ color: "var(--c-text-2)", fontFamily: "inherit", minHeight: "200px" }}
              />

              {/* Attachments */}
              {selected?.attachments?.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>Adjuntos</p>
                  <div className="space-y-1">
                    {selected.attachments.map(att => (
                      <div key={att.name} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                        style={{ background: "var(--c-hover)", border: "1px solid var(--c-border)" }}>
                        <span className="text-sm flex-1 truncate" style={{ color: "var(--c-text-2)" }}>{att.name}</span>
                        <a href={`http://localhost:8000${att.url}`} target="_blank" rel="noreferrer"
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: "var(--c-hover-2)", color: "var(--c-text-3)" }}>
                          Ver
                        </a>
                        <button onClick={() => setConfirmAtt(att.name)}
                          className="text-xs" style={{ color: "#f87171" }}>Eliminar</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags — compact footer bar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-6 py-2.5 flex-wrap"
              style={{ borderTop: "1px solid var(--c-border)", minHeight: "42px" }}>
              <span className="text-xs font-medium mr-0.5 flex-shrink-0" style={{ color: "var(--c-text-4)" }}>
                Etiquetas:
              </span>
              {draft.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--c-hover-2)", color: "var(--c-text-3)" }}>
                  #{t}
                  <button onClick={() => removeTag(t)} style={{ color: "var(--c-text-4)", lineHeight: 1 }}>×</button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={draft.tags.length === 0 ? "Añadir…" : "+"}
                className="text-xs outline-none bg-transparent"
                style={{ color: "var(--c-text-4)", width: draft.tags.length === 0 ? "80px" : "32px", minWidth: "32px" }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-4xl">📝</p>
            <p className="text-sm font-medium" style={{ color: "var(--c-text-3)" }}>Selecciona una nota o crea una nueva</p>
            <button onClick={newNote}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              Nueva nota
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmNote !== null}
        title="Eliminar nota"
        description="¿Eliminar esta nota permanentemente?"
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => deleteNote(confirmNote)}
        onCancel={() => setConfirmNote(null)}
      />
      <ConfirmModal
        open={confirmAtt !== null}
        title="Eliminar adjunto"
        description={`¿Eliminar el archivo "${confirmAtt}"?`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => deleteAttachment(confirmAtt)}
        onCancel={() => setConfirmAtt(null)}
      />
    </div>
  );
}
