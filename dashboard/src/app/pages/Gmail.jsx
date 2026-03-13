import { useState, useRef, useEffect } from "react";
import { Surface } from "@viernes/ui/react";

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

// ─── Colores por tag ──────────────────────────────────────────────────────────
const TAG = {
  dev:      "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  work:     "bg-purple-500/15 text-purple-300 border-purple-500/20",
  personal: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  finance:  "bg-amber-500/15 text-amber-300 border-amber-500/20",
  cloud:    "bg-blue-500/15 text-blue-300 border-blue-500/20",
};

// ─── Mock emails ──────────────────────────────────────────────────────────────
const EMAILS = [
  { id:"1",  from:"GitHub",       email:"noreply@github.com",         subject:"PR merged: feat/gmail-integration",             snippet:"Your pull request was merged into main successfully.",                      date:"10:42",  unread:true,  tag:"dev",      starred:false },
  { id:"2",  from:"Vercel",       email:"notifications@vercel.com",   subject:"Deployment successful – viernes-dashboard",     snippet:"Your latest deployment is live at viernes.vercel.app.",                    date:"09:15",  unread:true,  tag:"dev",      starred:true  },
  { id:"3",  from:"Google Cloud", email:"noreply@google.com",         subject:"Action required: Verify OAuth consent screen",  snippet:"To continue using Gmail API please verify your app.",                      date:"Ayer",   unread:false, tag:"cloud",    starred:false },
  { id:"4",  from:"Notion",       email:"team@notion.so",             subject:"Weekly digest: 3 updates en Viernes workspace", snippet:"Aquí está lo que pasó esta semana en tu workspace.",                       date:"Ayer",   unread:false, tag:"work",     starred:false },
  { id:"5",  from:"Amazon",       email:"shipment@amazon.com.mx",     subject:"Tu pedido ha sido enviado 📦",                  snippet:"Tu pedido #123-456 será entregado mañana entre 10am-2pm.",                 date:"Mar 5",  unread:false, tag:"personal", starred:false },
  { id:"6",  from:"Linear",       email:"notifications@linear.app",   subject:"[Viernes] Issue assigned: WhatsApp integration",snippet:"Jesus assigned you to VIE-42: Implement WhatsApp integration.",            date:"Mar 5",  unread:false, tag:"dev",      starred:true  },
  { id:"7",  from:"Stripe",       email:"support@stripe.com",         subject:"Monthly statement available",                   snippet:"Your March 2026 statement is now available in your dashboard.",             date:"Mar 4",  unread:false, tag:"finance",  starred:false },
  { id:"8",  from:"OpenAI",       email:"billing@openai.com",         subject:"Invoice #INV-2026-03",                          snippet:"Your monthly invoice for API usage is ready to download.",                  date:"Mar 4",  unread:false, tag:"finance",  starred:false },
  { id:"9",  from:"Linear",       email:"notifications@linear.app",   subject:"[Viernes] Weekly update",                      snippet:"3 issues completed, 2 in progress, 1 blocked this week.",                  date:"Mar 3",  unread:false, tag:"dev",      starred:false },
  { id:"10", from:"Cloudflare",   email:"noreply@cloudflare.com",     subject:"DNS records updated for viernes.app",           snippet:"Your DNS changes have been propagated successfully.",                       date:"Mar 3",  unread:false, tag:"cloud",    starred:false },
];

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
    <div className={`${sz} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center text-white font-semibold shrink-0 border border-white/10`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

// ─── Email Row ────────────────────────────────────────────────────────────────
const EmailRow = ({ email, selected, onClick }) => (
  <button onClick={() => onClick(email)}
    className={`w-full flex items-start gap-2.5 px-3 py-3 text-left transition-all duration-100 border-b border-white/[0.05]
      ${selected
        ? "bg-white/[0.09] border-l-2 border-l-purple-400/50"
        : "hover:bg-white/[0.04] border-l-2 border-l-transparent"}`}>

    {/* unread dot */}
    <div className="w-2 pt-2 shrink-0">
      {email.unread && (
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px rgba(34,211,238,0.7)" }} />
      )}
    </div>

    <Avatar name={email.from} />

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-1">
        <span className={`text-xs truncate ${email.unread ? "text-white font-semibold" : "text-white/55"}`}>
          {email.from}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {email.starred && (
            <Ic d={ICONS.star} size={9} className="text-amber-400 fill-amber-400" />
          )}
          <span className="text-white/25 text-[10px]">{email.date}</span>
        </div>
      </div>
      <div className={`text-[11px] truncate mt-0.5 ${email.unread ? "text-white/85 font-medium" : "text-white/45"}`}>
        {email.subject}
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-white/22 text-[10px] truncate flex-1">{email.snippet}</span>
        {email.tag && (
          <span className={`text-[9px] px-1.5 py-px rounded-full border shrink-0 font-medium ${TAG[email.tag] || "bg-white/10 text-white/40 border-white/10"}`}>
            {email.tag}
          </span>
        )}
      </div>
    </div>
  </button>
);

// ─── Email Detail Panel ───────────────────────────────────────────────────────
const EmailDetail = ({ email, onClose }) => {
  if (!email) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/12">
      <Ic d={ICONS.inbox} size={48} />
      <p className="text-sm tracking-wide">Selecciona un correo para leerlo</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Cabecera */}
      <div className="px-5 py-4 border-b border-white/8 shrink-0">
        <div className="flex items-start gap-3 justify-between">
          <h2 className="text-white/90 font-semibold text-sm leading-snug flex-1">{email.subject}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/25 hover:text-white/55 transition-colors shrink-0">
            <Ic d={ICONS.close} size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2.5 mt-3">
          <Avatar name={email.from} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white/70 text-xs font-medium">{email.from}</span>
              <span className="text-white/25 text-[10px]">&lt;{email.email}&gt;</span>
            </div>
            <div className="text-white/25 text-[10px] mt-0.5">{email.date}</div>
          </div>
          {email.tag && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TAG[email.tag] || ""}`}>
              {email.tag}
            </span>
          )}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-white/55 text-sm leading-relaxed">{email.snippet}</p>
        <p className="text-white/38 text-sm leading-relaxed mt-4">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <p className="text-white/38 text-sm leading-relaxed mt-3">
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
        </p>
        <div className="mt-6 pt-4 border-t border-white/8 text-white/25 text-xs">
          — {email.from} Team
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 py-3 border-t border-white/8 flex items-center gap-2 shrink-0">
        {[
          { icon: ICONS.reply,   label: "Responder" },
          { icon: ICONS.forward, label: "Reenviar" },
          { icon: ICONS.compose, label: "Archivar" },
        ].map(({ icon, label }) => (
          <button key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-white/40 hover:text-white/70 text-xs border border-white/8 transition-colors">
            <Ic d={icon} size={11} />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
          <Ic d={ICONS.trash} size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Compose Modal — panel lateral izquierdo con chat IA ──────────────────────
const ComposeModal = ({ onClose }) => {
  const [msgs, setMsgs]     = useState([
    { role: "ai", text: "Hola! Dime a quién le quieres escribir, el tema y el tono. Yo redacto el correo por ti." }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft]   = useState(null);
  const [view, setView]     = useState("chat");   // "chat" | "draft"
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
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Redacta un correo. El usuario dice: "${txt}".
Responde SOLO con JSON sin texto extra:
{"to":"correo/nombre","subject":"asunto","body":"cuerpo completo"}
Si necesitas más info antes de redactar, responde en texto normal.`
        }),
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
            setMsgs(prev => [...prev, { role: "ai", text: "✓ Borrador listo — puedes editarlo antes de enviar." }]);
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel lateral izquierdo */}
      <div className="fixed left-0 top-0 h-full z-50 w-[390px] flex flex-col"
        style={{
          background: "linear-gradient(160deg,rgba(10,18,38,0.99) 0%,rgba(5,10,24,0.99) 100%)",
          borderRight: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "12px 0 48px rgba(0,0,0,0.55), inset -1px 0 0 rgba(139,92,246,0.08)",
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10"
              style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(6,182,212,0.2))" }}>
              <Ic d={ICONS.compose} size={12} className="text-cyan-300" />
            </div>
            <div>
              <div className="text-white/80 text-sm font-medium leading-none">Redactar con Viernes</div>
              <div className="text-white/28 text-[10px] mt-0.5">IA · asistente de correo</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === "draft" && (
              <button onClick={() => setView("chat")}
                className="px-2 py-1 text-[11px] text-white/35 hover:text-white/65 transition-colors rounded-md hover:bg-white/[0.06]">
                ← Chat
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white/60 transition-colors">
              <Ic d={ICONS.close} size={13} />
            </button>
          </div>
        </div>

        {view === "chat" ? (
          <>
            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "ai" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-white/10"
                      style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.35),rgba(6,182,212,0.3))" }}>
                      <Ic d={ICONS.ai} size={10} className="text-cyan-200" />
                    </div>
                  )}
                  <div className={`max-w-[86%] px-3 py-2 text-xs leading-relaxed rounded-2xl
                    ${m.role === "user"
                      ? "text-white/80 rounded-tr-sm border border-purple-400/15"
                      : "text-white/60 rounded-tl-sm border border-white/8 bg-white/[0.05]"}`}
                    style={m.role === "user" ? { background: "linear-gradient(135deg,rgba(139,92,246,0.22),rgba(139,92,246,0.14))" } : {}}>
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-white/10"
                    style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.35),rgba(6,182,212,0.3))" }}>
                    <Ic d={ICONS.ai} size={10} className="text-cyan-200" />
                  </div>
                  <div className="bg-white/[0.05] border border-white/8 px-3 py-2.5 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1 items-center">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full bg-white/30 animate-bounce"
                          style={{ animationDelay: `${i * 120}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input chat */}
            <div className="px-3 pb-3 shrink-0">
              <div className="rounded-xl border border-white/10 focus-within:border-purple-400/30 transition-colors overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Ej: Escríbele a mi jefe que no iré el viernes, tono formal..."
                  rows={3}
                  className="w-full bg-transparent text-white/72 text-xs placeholder:text-white/18 resize-none outline-none px-3 pt-3 pb-1 leading-relaxed"
                />
                <div className="flex items-center justify-between px-3 pb-2.5">
                  <span className="text-white/18 text-[9px]">Enter para enviar · Shift+Enter nueva línea</span>
                  <button onClick={sendMsg} disabled={!input.trim() || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/82 text-xs border border-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.4),rgba(6,182,212,0.32))" }}>
                    <Ic d={ICONS.send} size={10} />
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Vista de borrador */
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {[
                { label: "Para",   key: "to",      ph: "destinatario@ejemplo.com", mono: true  },
                { label: "Asunto", key: "subject",  ph: "Asunto",                  mono: false },
              ].map(({ label, key, ph, mono }) => (
                <div key={key}>
                  <label className="text-white/30 text-[10px] uppercase tracking-widest mb-1 block">{label}</label>
                  <input value={draft?.[key] || ""} onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph}
                    className={`w-full border border-white/10 rounded-xl px-3 py-2 text-white/72 text-xs placeholder:text-white/18 outline-none focus:border-white/22 transition-colors ${mono ? "font-mono" : ""}`}
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  />
                </div>
              ))}
              <div>
                <label className="text-white/30 text-[10px] uppercase tracking-widest mb-1 block">Mensaje</label>
                <textarea value={draft?.body || ""} onChange={e => setDraft(p => ({ ...p, body: e.target.value }))}
                  rows={13}
                  className="w-full border border-white/10 rounded-xl px-3 py-2.5 text-white/72 text-xs placeholder:text-white/18 outline-none focus:border-white/22 transition-colors resize-none leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                />
              </div>
            </div>

            <div className="px-4 pb-4 flex gap-2 shrink-0">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-white/82 border border-white/10 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.28),rgba(6,182,212,0.22))" }}>
                <Ic d={ICONS.send} size={12} />
                Enviar correo
              </button>
              <button className="px-4 py-2.5 rounded-xl text-white/35 hover:text-white/60 text-xs border border-white/8 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                Borrador
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── Página principal Gmail ───────────────────────────────────────────────────
export default function Gmail() {
  const [emails, setEmails]     = useState(EMAILS);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [composing, setComposing] = useState(false);

  const unread = emails.filter(e => e.unread).length;

  const filtered = emails.filter(e => {
    if (filter === "unread"  && !e.unread)   return false;
    if (filter === "starred" && !e.starred)  return false;
    if (search) {
      const q = search.toLowerCase();
      if (![e.from, e.subject, e.snippet].some(s => s.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  const selectEmail = (email) => {
    setSelected(email);
    setEmails(p => p.map(e => e.id === email.id ? { ...e, unread: false } : e));
  };

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">

      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold text-base">Gmail</h1>
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[11px] border border-cyan-500/20 font-medium">
              {unread} no leídos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/8 text-white/35 hover:text-white/65 transition-colors">
            <Ic d={ICONS.refresh} size={14} />
          </button>
          <button onClick={() => setComposing(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-white/82 border border-white/10 transition-all hover:border-purple-400/25 hover:opacity-95"
            style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.22),rgba(6,182,212,0.17))" }}>
            <Ic d={ICONS.compose} size={13} />
            Redactar
          </button>
        </div>
      </div>

      {/* Dos paneles */}
      <div className="flex-1 min-h-0 flex gap-4">

        {/* Lista */}
        <Surface className="w-[340px] shrink-0 flex flex-col overflow-hidden !p-0">

          {/* Toolbar */}
          <div className="px-3 pt-3 pb-2.5 border-b border-white/8 space-y-2 shrink-0">
            <div className="flex items-center gap-2 rounded-xl px-2.5 py-2 border border-white/8 focus-within:border-white/15 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <Ic d={ICONS.search} size={12} className="text-white/22 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar correos..."
                className="flex-1 bg-transparent text-white/68 text-xs placeholder:text-white/18 outline-none"
              />
            </div>
            <div className="flex gap-0.5">
              {[
                { k: "all",     l: "Todos"      },
                { k: "unread",  l: "No leídos"  },
                { k: "starred", l: "★ Destacados" },
              ].map(({ k, l }) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors
                    ${filter === k
                      ? "bg-white/10 text-white/80"
                      : "text-white/30 hover:text-white/52 hover:bg-white/[0.04]"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Emails */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/15 gap-2 py-10">
                <Ic d={ICONS.inbox} size={32} />
                <p className="text-xs">Sin correos</p>
              </div>
            ) : filtered.map(e => (
              <EmailRow key={e.id} email={e} selected={selected?.id === e.id} onClick={selectEmail} />
            ))}
          </div>

          <div className="px-3 py-2 border-t border-white/[0.05] shrink-0">
            <span className="text-white/18 text-[10px]">{filtered.length} correo{filtered.length !== 1 ? "s" : ""}</span>
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
