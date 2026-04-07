import { useEffect, useState, useRef } from "react";
import { viernesApi } from "@apis/viernes";

export default function Chat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [memoryMode, setMemoryMode] = useState("auto"); // auto | ask | off
  const bottomRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días, señor.";
    if (hour < 19) return "Buenas tardes, señor.";
    return "Buenas noches, señor.";
  }

  async function refreshSessions() {
    const s = await viernesApi.listSessions();
    setSessions(s);
  }

  async function newChat() {
    const s = await viernesApi.createSession();
    await refreshSessions();
    setActiveSessionId(s.id);
  }

  async function loadMessages(sessionId) {
    const msgs = await viernesApi.getMessages(sessionId);
    setMessages(msgs);
    // scroll abajo
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      0,
    );
  }

  useEffect(() => {
    (async () => {
      await refreshSessions();
      // si no hay chats, crea uno
      const s = await viernesApi.listSessions();
      if (s.length === 0) {
        const created = await viernesApi.createSession();
        setActiveSessionId(created.id);
        setSessions([created]);
      } else {
        setActiveSessionId(s[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;

    let cancelled = false;

    (async () => {
      const msgs = await viernesApi.getMessages(activeSessionId);
      if (cancelled) return;
      setMessages(msgs);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSessionId]);

  function setAssistantError(tempAssistantId, msg) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempAssistantId
          ? { ...m, content: `⚠️ ${msg}`, is_error: true }
          : m,
      ),
    );
  }

  async function send(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    setIsLoading(true);
    setError(null);

    // UI: agrega el mensaje del user y un placeholder del assistant
    const tempAssistantId = `temp-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text },
      {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        is_streaming: true,
      },
    ]);

    setMessage("");

    try {
      const res = await viernesApi.chatStream({
        message: text,
        session_id: activeSessionId,
        memory_mode: memoryMode,
      });

      if (!res.ok) {
        // intenta leer body como texto (muchas veces viene el detalle)
        const txt = await res.text().catch(() => "");
        throw new Error(
          `HTTP ${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`,
        );
      }

      if (!res.body) throw new Error("Stream inválido (sin body)");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      let realSessionId = activeSessionId;
      let realAssistantMessageId = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;

          const evt = JSON.parse(line.replace("data: ", ""));

          if (evt.type === "start") {
            realSessionId = evt.session_id;
            realAssistantMessageId = evt.assistant_message_id;

            // por si se creó sesión nueva
            setActiveSessionId(realSessionId);
            await refreshSessions();
          }

          if (evt.type === "delta") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, content: m.content + evt.delta, is_streaming: true }
                  : m,
              ),
            );
          }

          if (evt.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, is_streaming: false } : m,
              ),
            );
            await loadMessages(realSessionId);
          }

          if (evt.type === "error") {
            setError(evt.message);
            setAssistantError(tempAssistantId, evt.message);
            // opcional: abortar el stream ya
            reader.cancel?.();
            return; // salir del send
          }
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err?.message || "Error al responder";
      setError(msg);
      setAssistantError(tempAssistantId, msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full min-h-0 flex gap-4 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 h-full min-h-0 rounded-xl p-3 flex flex-col gap-3 overflow-hidden"
        style={{ border: "1px solid var(--c-border-med)", background: "var(--c-surface)" }}>
        <button
          className="rounded-xl px-3 py-2 transition-colors text-sm font-medium"
          style={{ border: "1px solid var(--c-border)", color: "var(--c-text-2)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--c-text)"; e.currentTarget.style.background = "var(--c-hover)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--c-text-2)"; e.currentTarget.style.background = "transparent"; }}
          onClick={newChat}
        >
          Nuevo chat
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm shrink-0" style={{ color: "var(--c-text-2)" }}>Memoria</span>
          <select
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ background: "var(--c-input-bg)", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
            value={memoryMode}
            onChange={(e) => setMemoryMode(e.target.value)}
          >
            <option value="auto">Auto</option>
            <option value="ask">Preguntar</option>
            <option value="off">Off</option>
          </select>
        </div>

        {/* SOLO ESTA LISTA SCROLLEA */}
        <div className="flex-1 min-h-0 overflow-auto space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className="w-full text-left px-3 py-2 rounded-lg border transition-colors"
              style={activeSessionId === s.id
                ? { background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "var(--c-accent)" }
                : { background: "transparent", border: "1px solid transparent", color: "var(--c-text-3)" }
              }
              onMouseEnter={e => { if (activeSessionId !== s.id) { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "var(--c-text-2)"; } }}
              onMouseLeave={e => { if (activeSessionId !== s.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-text-3)"; } }}
            >
              <div className="text-sm font-semibold truncate">
                {s.title || "Sin título"}
              </div>
              <div className="text-xs opacity-70 truncate">{s.id}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex-1 min-w-0 h-full min-h-0 rounded-xl flex flex-col overflow-hidden"
        style={{ border: "1px solid var(--c-border-med)", background: "var(--c-surface)" }}>
        <div className="p-3 font-semibold text-sm" style={{ color: "var(--c-text-2)", borderBottom: "1px solid var(--c-border)" }}>Chat</div>

        {/* SOLO MENSAJES SCROLLEAN */}
        <div className="flex-1 min-h-0 overflow-auto overflow-x-hidden p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-2xl font-semibold" style={{ color: "var(--c-text)" }}>{getGreeting()}</p>
                <p className="text-sm" style={{ color: "var(--c-text-3)" }}>¿En qué puedo asistirle?</p>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role !== "user" && (
                <img src="/Logo_sf.png" alt="SODIGIC" className="w-7 h-7 rounded-lg object-contain shrink-0 mt-0.5" />
              )}
              <div
                className="rounded-2xl px-4 py-3 max-w-[52ch] break-words"
                style={m.is_error
                  ? { border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)" }
                  : m.role === "user"
                    ? { background: "var(--c-accent-bg)", border: "1px solid rgba(124,58,237,0.2)" }
                    : { background: "var(--c-surface-2)", border: "1px solid var(--c-border-med)" }
                }
              >
                <div className="text-[10px] font-semibold mb-1 uppercase tracking-wider"
                  style={{ color: m.role === "user" ? "var(--c-accent)" : "var(--c-cyan)" }}>
                  {m.role === "user" ? "Tú" : "Viernes"}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: "var(--c-text)" }}>
                  {m.content}
                </div>
                {m.role === "assistant" && m.is_streaming && (
                  <div className="mt-2 text-xs" style={{ color: "var(--c-text-3)" }}>Escribiendo...</div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Composer fijo abajo */}
        <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--c-border-med)" }}>
          {isLoading && (
            <div className="text-sm mb-2" style={{ color: "var(--c-text-3)" }}>
              Viernes está pensando...
            </div>
          )}
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

          <form onSubmit={send} className="flex gap-2">
            <input
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--c-input-bg)", color: "var(--c-text)", border: "1px solid var(--c-border)" }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe..."
              disabled={isLoading}
            />
            <button
              className="rounded-lg px-4 py-2 text-sm transition disabled:opacity-50"
              style={{ background: "var(--c-hover)", color: "var(--c-text)", border: "1px solid var(--c-border-med)" }}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
