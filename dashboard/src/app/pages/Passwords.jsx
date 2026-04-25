import { useState, useEffect, useRef } from "react";
import { viernesApi } from "@/lib/apis/viernes";
import { deriveKey, encrypt, decrypt, generatePassword } from "@/lib/crypto";
import { SearchSelect, ConfirmModal } from "@viernes/ui/react";

const CATEGORIES = ["general", "trabajo", "redes sociales", "banco", "email", "desarrollo", "otro"];
const CAT_OPTS = CATEGORIES.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));

const ICON_LOCK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ICON_UNLOCK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);
const ICON_EYE = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const ICON_EYE_OFF = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const ICON_COPY = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const ICON_PLUS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ICON_REFRESH = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const ICON_SEARCH = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const ICON_TRASH = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

const EMPTY_ENTRY = { title: "", username_hint: "", url: "", category: "general", password: "", notes: "" };

// VaultData = JSON object we store as the plaintext: { password, notes }

function categoryColor(cat) {
  const map = {
    trabajo: "#818cf8", banco: "#f59e0b", "redes sociales": "#ec4899",
    email: "#22d3ee", desarrollo: "#34d399", otro: "#94a3b8", general: "var(--c-accent)"
  };
  return map[cat] || "var(--c-accent)";
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
      style={{ background: "var(--c-hover)", color: copied ? "#34d399" : "var(--c-text-3)" }}>
      {ICON_COPY} {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

// ── Lock screen ────────────────────────────────────────────────────────────────

function LockScreen({ salt, isFirstTime, onUnlock }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!pw) { setErr("Ingresa la contraseña maestra"); return; }
    if (isFirstTime && pw !== pw2) { setErr("Las contraseñas no coinciden"); return; }
    if (isFirstTime && pw.length < 8) { setErr("Mínimo 8 caracteres"); return; }
    setLoading(true);
    try {
      const key = await deriveKey(pw, salt);
      onUnlock(key);
    } catch (e) { setErr("Error al derivar la clave: " + e.message); }
    finally { setLoading(false); }
  }

  const inputCls = "px-4 py-3 rounded-xl text-sm outline-none w-full";
  const inputStyle = { background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "var(--c-hover-2)", color: "var(--c-accent)" }}>
            {ICON_LOCK}
          </div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text)" }}>
            {isFirstTime ? "Crear bóveda" : "Desbloquear bóveda"}
          </h2>
          <p className="text-sm" style={{ color: "var(--c-text-4)" }}>
            {isFirstTime
              ? "Elige una contraseña maestra fuerte. No se puede recuperar si la olvidas."
              : "Ingresa tu contraseña maestra para acceder a las contraseñas guardadas."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Contraseña maestra"
              className={inputCls}
              style={inputStyle}
              autoFocus
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--c-text-4)" }}>
              {show ? ICON_EYE_OFF : ICON_EYE}
            </button>
          </div>

          {isFirstTime && (
            <input
              type={show ? "text" : "password"}
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              placeholder="Confirmar contraseña maestra"
              className={inputCls}
              style={inputStyle}
            />
          )}

          {err && <p className="text-sm" style={{ color: "#f87171" }}>{err}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--c-accent)", color: "#fff" }}>
            {loading ? "Procesando…" : isFirstTime ? "Crear bóveda" : "Desbloquear"}
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: "var(--c-text-4)" }}>
          🔒 Cifrado AES-256-GCM · El servidor nunca ve tus contraseñas
        </p>
      </div>
    </div>
  );
}

// ── Entry form modal ───────────────────────────────────────────────────────────

function EntryModal({ entry, vaultKey, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_ENTRY, ...entry });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setErr("El título es obligatorio"); return; }
    if (!form.password) { setErr("La contraseña no puede estar vacía"); return; }
    setSaving(true);
    setErr("");
    try {
      const plaintext = JSON.stringify({ password: form.password, notes: form.notes });
      const { encrypted_data, iv } = await encrypt(vaultKey, plaintext);
      const payload = {
        title: form.title,
        username_hint: form.username_hint,
        url: form.url,
        category: form.category,
        encrypted_data,
        iv,
      };
      await onSave(payload, entry?.id);
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  function genPw() {
    setForm(f => ({ ...f, password: generatePassword() }));
    setShowPw(true);
  }

  const inputCls = "px-3 py-2 rounded-lg text-sm outline-none w-full";
  const inputStyle = { background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: "var(--c-text)" }}>
            {entry?.id ? "Editar entrada" : "Nueva entrada"}
          </h3>
          <button onClick={onClose} style={{ color: "var(--c-text-4)" }} className="text-xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Servicio / Sitio *</label>
              <input className={inputCls} style={inputStyle} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Google, Netflix…" autoFocus />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Usuario / Email</label>
              <input className={inputCls} style={inputStyle} value={form.username_hint}
                onChange={e => setForm(f => ({ ...f, username_hint: e.target.value }))} placeholder="email@ejemplo.com" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Categoría</label>
              <SearchSelect
                variant="dark"
                options={CAT_OPTS}
                value={form.category}
                onChange={v => setForm(f => ({ ...f, category: v }))}
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>URL</label>
              <input className={inputCls} style={inputStyle} value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Contraseña *</label>
                <button type="button" onClick={genPw}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                  style={{ background: "var(--c-hover-2)", color: "var(--c-text-3)" }}>
                  {ICON_REFRESH} Generar
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className={inputCls}
                  style={{ ...inputStyle, paddingRight: "5rem" }}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Contraseña"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ color: "var(--c-text-4)" }}>
                    {showPw ? ICON_EYE_OFF : ICON_EYE}
                  </button>
                  {form.password && <CopyButton text={form.password} />}
                </div>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: "var(--c-text-4)" }}>Notas (opcional)</label>
              <textarea className={inputCls} style={{ ...inputStyle, minHeight: "60px", resize: "none" }}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas adicionales…" />
            </div>
          </div>

          {err && <p className="text-sm" style={{ color: "#f87171" }}>{err}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              {saving ? "Cifrando…" : "Guardar"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ color: "var(--c-text-3)" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Entry card ─────────────────────────────────────────────────────────────────

function EntryCard({ entry, vaultKey, onEdit, onDelete }) {
  const [decrypted, setDecrypted] = useState(null);  // { password, notes }
  const [showPw, setShowPw] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [decryptErr, setDecryptErr] = useState("");

  async function reveal() {
    if (decrypted) { setExpanded(e => !e); return; }
    try {
      const plain = await decrypt(vaultKey, entry.encrypted_data, entry.iv);
      setDecrypted(JSON.parse(plain));
      setExpanded(true);
    } catch {
      setDecryptErr("Error al descifrar — contraseña maestra incorrecta");
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border-med)", background: "var(--c-shell)" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Category dot */}
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: categoryColor(entry.category) }} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{entry.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {entry.username_hint && (
              <span className="text-xs truncate" style={{ color: "var(--c-text-4)" }}>{entry.username_hint}</span>
            )}
            {entry.url && (
              <a href={entry.url} target="_blank" rel="noreferrer"
                className="text-xs truncate"
                style={{ color: "var(--c-accent)", opacity: 0.8 }}>
                {new URL(entry.url.startsWith("http") ? entry.url : `https://${entry.url}`).hostname}
              </a>
            )}
          </div>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: "var(--c-hover-2)", color: "var(--c-text-3)" }}>
          {entry.category}
        </span>

        <button onClick={reveal}
          className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: "var(--c-hover-2)", color: "var(--c-text-2)" }}>
          {expanded ? "Ocultar" : "Ver"}
        </button>

        <button onClick={() => onEdit(entry)}
          className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: "var(--c-hover)", color: "var(--c-text-3)" }}>Editar</button>

        <button onClick={() => onDelete(entry.id)}
          className="flex-shrink-0 text-xs" style={{ color: "#f87171" }}>{ICON_TRASH}</button>
      </div>

      {decryptErr && (
        <div className="px-4 py-2 text-xs" style={{ color: "#f87171", background: "rgba(248,113,113,0.08)" }}>{decryptErr}</div>
      )}

      {expanded && decrypted && (
        <div className="px-4 pb-4 pt-1 space-y-2" style={{ borderTop: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm rounded-lg px-3 py-2 font-mono"
              style={{ background: "var(--c-hover)", color: "var(--c-text)", letterSpacing: showPw ? "normal" : "0.25em" }}>
              {showPw ? decrypted.password : "•".repeat(Math.min(decrypted.password.length, 20))}
            </code>
            <button onClick={() => setShowPw(s => !s)} style={{ color: "var(--c-text-4)" }}>
              {showPw ? ICON_EYE_OFF : ICON_EYE}
            </button>
            <CopyButton text={decrypted.password} />
          </div>
          {decrypted.notes && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--c-hover)", color: "var(--c-text-3)" }}>
              {decrypted.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Passwords() {
  const [vaultKey, setVaultKey] = useState(null);   // CryptoKey in memory only
  const [salt, setSalt] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("todos");
  const [modal, setModal] = useState(null);         // null | { entry? }
  const [confirmId, setConfirmId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true);
    try {
      const cfg = await viernesApi.vaultConfig();
      if (cfg.initialized) {
        setSalt(cfg.salt);
        setIsFirstTime(false);
      } else {
        const { salt: newSalt } = await viernesApi.initVault();
        setSalt(newSalt);
        setIsFirstTime(true);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function loadEntries() {
    try { setEntries(await viernesApi.listVaultEntries()); }
    catch (e) { setError(e.message); }
  }

  function handleUnlock(key) {
    setVaultKey(key);
    setIsFirstTime(false);
    loadEntries();
  }

  async function handleSave(payload, id) {
    if (id) await viernesApi.updateVaultEntry(id, payload);
    else await viernesApi.createVaultEntry(payload);
    await loadEntries();
  }

  async function handleDelete(id) {
    try { await viernesApi.deleteVaultEntry(id); await loadEntries(); }
    catch (e) { setError(e.message); }
    finally { setConfirmId(null); }
  }

  const filtered = entries.filter(e => {
    const matchCat = catFilter === "todos" || e.category === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || e.title.toLowerCase().includes(q) || e.username_hint.toLowerCase().includes(q) || e.url.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--c-text-4)" }}>Cargando bóveda…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  if (!vaultKey) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--c-border-med)" }}>
          <span style={{ color: "var(--c-accent)" }}>{ICON_LOCK}</span>
          <h1 className="text-lg font-semibold" style={{ color: "var(--c-text)" }}>Bóveda de contraseñas</h1>
        </div>
        <LockScreen salt={salt} isFirstTime={isFirstTime} onUnlock={handleUnlock} />
      </div>
    );
  }

  const inputCls = "px-3 py-2 rounded-lg text-sm outline-none";
  const inputStyle = { background: "var(--c-hover)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-border-med)" }}>
        <span style={{ color: "var(--c-accent)" }}>{ICON_UNLOCK}</span>
        <h1 className="text-lg font-semibold" style={{ color: "var(--c-text)" }}>Bóveda de contraseñas</h1>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
          Desbloqueada
        </span>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-4)" }}>{ICON_SEARCH}</span>
          <input className={inputCls} style={{ ...inputStyle, paddingLeft: "2rem", width: "200px" }}
            placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category filter */}
        <select className={inputCls} style={inputStyle} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="todos">Todas</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button onClick={() => setModal({})}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "var(--c-accent)", color: "#fff" }}>
          {ICON_PLUS} Nueva
        </button>

        <button onClick={() => setVaultKey(null)}
          className="text-xs px-3 py-2 rounded-xl"
          style={{ color: "var(--c-text-3)", background: "var(--c-hover)" }}>
          Bloquear
        </button>
      </div>

      {/* Stats bar */}
      <div className="px-6 py-2 flex items-center gap-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-shell)" }}>
        <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
          {entries.length} entrada{entries.length !== 1 ? "s" : ""} guardada{entries.length !== 1 ? "s" : ""}
          {filtered.length !== entries.length && ` · ${filtered.length} mostrada${filtered.length !== 1 ? "s" : ""}`}
        </p>
        <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
          🔒 AES-256-GCM · PBKDF2 · 600 000 iteraciones
        </p>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <p className="text-4xl">🔑</p>
            <p className="text-sm" style={{ color: "var(--c-text-4)" }}>
              {search || catFilter !== "todos" ? "Sin resultados" : "No hay contraseñas guardadas. Agrega la primera."}
            </p>
            {!search && catFilter === "todos" && (
              <button onClick={() => setModal({})}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "var(--c-accent)", color: "#fff" }}>
                Nueva entrada
              </button>
            )}
          </div>
        )}
        {filtered.map(entry => (
          <EntryCard
            key={entry.id}
            entry={entry}
            vaultKey={vaultKey}
            onEdit={e => setModal({ entry: { ...e } })}
            onDelete={id => setConfirmId(id)}
          />
        ))}
      </div>

      {/* Entry modal */}
      {modal !== null && (
        <EntryModal
          entry={modal.entry}
          vaultKey={vaultKey}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmModal
        open={confirmId !== null}
        title="Eliminar contraseña"
        description="¿Eliminar esta entrada del vault? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        onConfirm={() => handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
