import { useState, useRef, useEffect, useCallback } from "react";
import { Surface } from "@viernes/ui/react";
import { viernesApi } from "@apis/viernes";

// ─── Micro SVG icons ──────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);
const ICONS = {
  compose:  "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  refresh:  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  close:    "M18 6L6 18M6 6l12 12",
  send:     "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  reply:    "M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11l4 4v5M17 21l-5-5 5-5M22 16H12",
  inbox:    "M22 12h-6l-2 3H10l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  ai:       "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  forward:  "M5 12h14M12 5l7 7-7 7",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseFromHeader(from) {
  const match = from.match(/^"?(.+?)"?\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2] };
  return { name: from, email: from };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const oneDay = 86400000;
    if (diff < oneDay && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < oneDay * 2) return "Ayer";
    return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function guessTag(from, subject) {
  const f = (from + " " + subject).toLowerCase();
  if (/github|vercel|linear|gitlab|netlify|docker|npm/.test(f)) return "dev";
  if (/google cloud|aws|azure|cloudflare/.test(f)) return "cloud";
  if (/stripe|invoice|factura|payment|statement/.test(f)) return "finance";
  if (/notion|slack|trello|jira|asana/.test(f)) return "work";
  if (/amazon|mercadolibre|uber|rappi|pedido|envio/.test(f)) return "personal";
  return null;
}

// ─── Colores por tag ──────────────────────────────────────────────────────────
const TAG = {
  dev:      "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  work:     "bg-purple-500/15 text-purple-300 border-purple-500/20",
  personal: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  finance:  "bg-amber-500/15 text-amber-300 border-amber-500/20",
  cloud:    "bg-blue-500/15 text-blue-300 border-blue-500/20",
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = "md" }) => {
  const palettes = [
    "from-purple-500/50 to-purple-700/40",
    "from-cyan-500/50 to-cyan-700/40",
    "from-blue-500/50 to-blue-700/40",
    "from-emerald-500/50 to-emerald-700/40",
    "from-amber-500/50 to-amber-700/40",
    "from-rose-500/50 to-rose-700/40",
  ];
  const bg = palettes[(name?.charCodeAt(0) || 0) % palettes.length];
  const sz = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center font-semibold shrink-0`}
      style={{ color: "var(--c-text)", border: "1px solid var(--c-border-med)" }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

// ─── Email Row ────────────────────────────────────────────────────────────────
const EmailRow = ({ email, selected, onClick }) => {
  const { name } = parseFromHeader(email.from);
  const tag = guessTag(email.from, email.subject);

  return (
    <button
      onClick={() => onClick(email)}
      className="w-full flex items-start gap-2.5 px-3 py-3 text-left transition-all duration-100"
      style={{
        borderBottom: "1px solid var(--c-border)",
        borderLeft: `2px solid ${selected ? "var(--c-accent)" : "transparent"}`,
        background: selected ? "var(--c-accent-bg)" : "transparent",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "var(--c-hover)"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <div className="w-2 pt-2 shrink-0">
        {email.unread && (
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--c-cyan)", boxShadow: "0 0 6px rgba(34,211,238,0.5)" }} />
        )}
      </div>

      <Avatar name={name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs truncate" style={{ color: email.unread ? "var(--c-text)" : "var(--c-text-2)", fontWeight: email.unread ? 600 : 400 }}>
            {name}
          </span>
          <span className="text-[10px] shrink-0" style={{ color: "var(--c-text-4)" }}>{formatDate(email.date)}</span>
        </div>
        <div className="text-[11px] truncate mt-0.5" style={{ color: email.unread ? "var(--c-text-2)" : "var(--c-text-3)", fontWeight: email.unread ? 500 : 400 }}>
          {email.subject}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] truncate flex-1" style={{ color: "var(--c-text-4)" }}>{email.snippet}</span>
          {tag && (
            <span className={`text-[9px] px-1.5 py-px rounded-full border shrink-0 font-medium ${TAG[tag] || ""}`}
              style={!TAG[tag] ? { background: "var(--c-hover)", color: "var(--c-text-3)", border: "1px solid var(--c-border)" } : {}}>
              {tag}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ─── Email Detail Panel ───────────────────────────────────────────────────────
const EmailDetail = ({ email, onClose }) => {
  const [body, setBody] = useState(null);
  const [loadingBody, setLoadingBody] = useState(false);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;

    const fetchBody = async () => {
      try {
        const data = await viernesApi.gmailEmail(email.id);
        if (!cancelled) setBody(data.body || "(Sin contenido)");
      } catch {
        if (!cancelled) setBody("Error al cargar el contenido del correo.");
      } finally {
        if (!cancelled) setLoadingBody(false);
      }
    };

    setBody(null);
    setLoadingBody(true);
    fetchBody();

    return () => { cancelled = true; };
  }, [email?.id]);

  if (!email) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--c-text-4)" }}>
      <Ic d={ICONS.inbox} size={48} />
      <p className="text-sm tracking-wide">Selecciona un correo para leerlo</p>
    </div>
  );

  const { name, email: emailAddr } = parseFromHeader(email.from);
  const tag = guessTag(email.from, email.subject);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Cabecera */}
      <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-start gap-3 justify-between">
          <h2 className="font-semibold text-sm leading-snug flex-1" style={{ color: "var(--c-text)" }}>{email.subject}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: "var(--c-text-4)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--c-text-2)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-4)"}
          >
            <Ic d={ICONS.close} size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2.5 mt-3">
          <Avatar name={name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "var(--c-text-2)" }}>{name}</span>
              <span className="text-[10px]" style={{ color: "var(--c-text-4)" }}>&lt;{emailAddr}&gt;</span>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--c-text-4)" }}>{formatDate(email.date)}</div>
          </div>
          {tag && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TAG[tag] || ""}`}>
              {tag}
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {loadingBody ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--c-text-3)" }}>
            <div className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--c-border-med)", borderTopColor: "var(--c-text-3)" }} />
            Cargando...
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--c-text-2)" }}>
            {body}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="px-5 py-3 flex items-center gap-2 shrink-0" style={{ borderTop: "1px solid var(--c-border)" }}>
        {[
          { icon: ICONS.reply,   label: "Responder" },
          { icon: ICONS.forward, label: "Reenviar" },
          { icon: ICONS.compose, label: "Archivar" },
        ].map(({ icon, label }) => (
          <button key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: "var(--c-input-bg)", border: "1px solid var(--c-border)", color: "var(--c-text-3)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--c-text-2)"; e.currentTarget.style.background = "var(--c-hover)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-3)"; e.currentTarget.style.background = "var(--c-input-bg)"; }}
          >
            <Ic d={icon} size={11} />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
          style={{ color: "var(--c-text-4)" }}
        >
          <Ic d={ICONS.trash} size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Compose Modal — panel lateral izquierdo con chat IA ──────────────────────
// Este panel es intencionalmente oscuro (es un overlay modal con gradiente propio)
const ComposeModal = ({ onClose }) => {
  const [msgs, setMsgs]     = useState([
    { role: "ai", text: "Hola! Dime a quien le quieres escribir, el tema y el tono. Yo redacto el correo por ti." }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft]   = useState(null);
  const [view, setView]     = useState("chat");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const sendMsg = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", text: txt }]);
    setLoading(true);

    try {
      const res = await viernesApi.chatStream({
        message: `Redacta un correo. El usuario dice: "${txt}".
Responde SOLO con JSON sin texto extra:
{"to":"correo/nombre","subject":"asunto","body":"cuerpo completo"}
Si necesitas mas info antes de redactar, responde en texto normal.`
      });

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try { const d = JSON.parse(line.slice(6)); if (d.type === "delta") full += d.delta; } catch {}
        }
      }

      const m = full.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const p = JSON.parse(m[0]);
          if (p.subject || p.body) {
            setDraft(p);
            setView("draft");
            setMsgs(prev => [...prev, { role: "ai", text: "Borrador listo - puedes editarlo antes de enviar." }]);
            setLoading(false);
            return;
          }
        } catch {}
      }
      setMsgs(prev => [...prev, { role: "ai", text: full || "No pude generar el borrador." }]);
    } catch {
      setMsgs(prev => [...prev, { role: "ai", text: "Error al conectar con Viernes." }]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!draft?.to || !draft?.subject) return;
    try {
      await viernesApi.gmailSend({ to: draft.to, subject: draft.subject, body: draft.body || "" });
      setMsgs(prev => [...prev, { role: "ai", text: "Correo enviado correctamente." }]);
      setDraft(null);
      setView("chat");
    } catch (err) {
      setMsgs(prev => [...prev, { role: "ai", text: `Error al enviar: ${err.message}` }]);
      setView("chat");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed left-0 top-0 h-full z-50 w-[390px] flex flex-col"
        style={{
          background: "linear-gradient(160deg,rgba(10,18,38,0.99) 0%,rgba(5,10,24,0.99) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "12px 0 48px rgba(0,0,0,0.55), inset -1px 0 0 rgba(139,92,246,0.08)",
        }}>

        <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(6,182,212,0.2))", border: "1px solid rgba(255,255,255,0.10)" }}>
              <Ic d={ICONS.compose} size={12} className="text-cyan-300" />
            </div>
            <div>
              <div className="text-sm font-medium leading-none" style={{ color: "rgba(255,255,255,0.80)" }}>Redactar con Viernes</div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>IA - asistente de correo</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === "draft" && (
              <button onClick={() => setView("chat")}
                className="px-2 py-1 text-[11px] rounded-md transition-colors"
                style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
                ← Chat
              </button>
            )}
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.30)" }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.60)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.30)"}>
              <Ic d={ICONS.close} size={13} />
            </button>
          </div>
        </div>

        {view === "chat" ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "ai" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.35),rgba(6,182,212,0.3))", border: "1px solid rgba(255,255,255,0.10)" }}>
                      <Ic d={ICONS.ai} size={10} className="text-cyan-200" />
                    </div>
                  )}
                  <div className={`max-w-[86%] px-3 py-2 text-xs leading-relaxed rounded-2xl
                    ${m.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    style={m.role === "user"
                      ? { background: "linear-gradient(135deg,rgba(139,92,246,0.22),rgba(139,92,246,0.14))", color: "rgba(255,255,255,0.80)", border: "1px solid rgba(139,92,246,0.15)" }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.60)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.35),rgba(6,182,212,0.3))", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <Ic d={ICONS.ai} size={10} className="text-cyan-200" />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex gap-1 items-center">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full animate-bounce"
                          style={{ background: "rgba(255,255,255,0.30)", animationDelay: `${i * 120}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="px-3 pb-3 shrink-0">
              <div className="rounded-xl overflow-hidden transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Ej: Escribele a mi jefe que no ire el viernes, tono formal..."
                  rows={3}
                  className="w-full bg-transparent text-xs placeholder:opacity-20 resize-none outline-none px-3 pt-3 pb-1 leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                />
                <div className="flex items-center justify-between px-3 pb-2.5">
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.18)" }}>Enter para enviar · Shift+Enter nueva linea</span>
                  <button onClick={sendMsg} disabled={!input.trim() || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.4),rgba(6,182,212,0.32))", color: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.10)" }}>
                    <Ic d={ICONS.send} size={10} />
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {[
                { label: "Para",   key: "to",      ph: "destinatario@ejemplo.com", mono: true  },
                { label: "Asunto", key: "subject",  ph: "Asunto",                  mono: false },
              ].map(({ label, key, ph, mono }) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.30)" }}>{label}</label>
                  <input value={draft?.[key] || ""} onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph}
                    className={`w-full rounded-xl px-3 py-2 text-xs placeholder:opacity-20 outline-none transition-colors ${mono ? "font-mono" : ""}`}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.72)" }}
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] uppercase tracking-widest mb-1 block" style={{ color: "rgba(255,255,255,0.30)" }}>Mensaje</label>
                <textarea value={draft?.body || ""} onChange={e => setDraft(p => ({ ...p, body: e.target.value }))}
                  rows={13}
                  className="w-full rounded-xl px-3 py-2.5 text-xs placeholder:opacity-20 outline-none resize-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.72)" }}
                />
              </div>
            </div>

            <div className="px-4 pb-4 flex gap-2 shrink-0">
              <button onClick={handleSend}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.28),rgba(6,182,212,0.22))", color: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <Ic d={ICONS.send} size={12} />
                Enviar correo
              </button>
              <button
                className="px-4 py-2.5 rounded-xl text-xs transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.60)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
                Borrador
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Pagina principal Gmail ───────────────────────────────────────────────────
export default function Gmail() {
  const [emails, setEmails]       = useState([]);
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");
  const [composing, setComposing] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await viernesApi.gmailInbox(20);
      setEmails(data.emails || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const unread = emails.filter(e => e.unread).length;

  const filtered = emails.filter(e => {
    if (filter === "unread" && !e.unread) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![e.from, e.subject, e.snippet].some(s => (s || "").toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const selectEmail = (email) => {
    setSelected(email);
    if (email.unread) {
      setEmails(p => p.map(e => e.id === email.id ? { ...e, unread: false } : e));
      viernesApi.gmailMarkRead(email.id).catch(() => {});
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">

      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-base" style={{ color: "var(--c-text)" }}>Gmail</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px] border border-cyan-500/20 font-medium">
              {unread} no leidos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEmails}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${loading ? "animate-spin" : ""}`}
            style={{ color: "var(--c-text-3)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--c-text-2)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-3)"}
          >
            <Ic d={ICONS.refresh} size={14} />
          </button>
          <button onClick={() => setComposing(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg,rgba(139,92,246,0.22),rgba(6,182,212,0.17))",
              border: "1px solid var(--c-border-med)",
              color: "var(--c-text)",
            }}>
            <Ic d={ICONS.compose} size={13} />
            Redactar
          </button>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Dos paneles */}
      <div className="flex-1 min-h-0 flex gap-4">

        {/* Lista */}
        <Surface className="w-[340px] shrink-0 flex flex-col overflow-hidden !p-0">

          <div className="px-3 pt-3 pb-2.5 space-y-2 shrink-0" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors"
              style={{ background: "var(--c-input-bg)", border: "1px solid var(--c-border)" }}>
              <span style={{ color: "var(--c-text-4)", display: "flex", flexShrink: 0 }}>
                <Ic d={ICONS.search} size={12} />
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar correos..."
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "var(--c-text-2)" }}
              />
            </div>
            <div className="flex gap-0.5">
              {[
                { k: "all",    l: "Todos"     },
                { k: "unread", l: "No leidos" },
              ].map(({ k, l }) => (
                <button key={k} onClick={() => setFilter(k)}
                  className="flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors"
                  style={{
                    background: filter === k ? "var(--c-hover)" : "transparent",
                    color: filter === k ? "var(--c-text)" : "var(--c-text-3)",
                  }}
                  onMouseEnter={e => { if (filter !== k) e.currentTarget.style.color = "var(--c-text-2)"; }}
                  onMouseLeave={e => { if (filter !== k) e.currentTarget.style.color = "var(--c-text-3)"; }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-10" style={{ color: "var(--c-text-3)" }}>
                <div className="w-6 h-6 border-2 rounded-full animate-spin"
                  style={{ borderColor: "var(--c-border-med)", borderTopColor: "var(--c-text-3)" }} />
                <p className="text-xs">Cargando correos...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-10" style={{ color: "var(--c-text-4)" }}>
                <Ic d={ICONS.inbox} size={32} />
                <p className="text-xs">Sin correos</p>
              </div>
            ) : filtered.map(e => (
              <EmailRow key={e.id} email={e} selected={selected?.id === e.id} onClick={selectEmail} />
            ))}
          </div>

          <div className="px-3 py-2 shrink-0" style={{ borderTop: "1px solid var(--c-border)" }}>
            <span className="text-[10px]" style={{ color: "var(--c-text-4)" }}>
              {filtered.length} correo{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </Surface>

        {/* Lectura */}
        <Surface className="flex-1 flex flex-col overflow-hidden min-h-0 !p-0">
          <EmailDetail email={selected} onClose={() => setSelected(null)} />
        </Surface>
      </div>

      {composing && <ComposeModal onClose={() => setComposing(false)} />}
    </div>
  );
}
