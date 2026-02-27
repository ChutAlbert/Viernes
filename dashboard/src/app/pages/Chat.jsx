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

  async function send(e) {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await viernesApi.chat({
        message: text,
        session_id: activeSessionId,
        memory_mode: memoryMode,
      });

      await refreshSessions();
      await loadMessages(res.session_id);
      setActiveSessionId(res.session_id);
    } catch (err) {
      console.error(err);
      setError("Error al responder");
    } finally {
      //limpiar input
      setMessage("");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-40px)] gap-4 p-4">
      {/* Sidebar */}
      <aside className="w-72 border rounded-lg p-3 flex flex-col gap-3">
        <button className="border rounded px-3 py-2" onClick={newChat}>
          Nuevo chat
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm">Memoria</span>
          <select
            className="w-full bg-white/5 text-white border border-white/15 rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
            value={memoryMode}
            onChange={(e) => setMemoryMode(e.target.value)}
          >
            <option className="bg-slate-900 text-white" value="auto">
              Auto
            </option>
            <option className="bg-slate-900 text-white" value="ask">
              Preguntar
            </option>
            <option className="bg-slate-900 text-white" value="off">
              Off
            </option>
          </select>
        </div>

        <div className="flex-1 overflow-auto space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`w-full text-left px-3 py-2 rounded border ${
                activeSessionId === s.id ? "bg-white/10" : "bg-transparent"
              }`}
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
      <main className="flex-1 border rounded-lg flex flex-col overflow-hidden">
        <div className="border-b p-3 font-semibold">Chat</div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-lg px-3 py-2 border ${
                m.role === "user" ? "ml-auto" : "mr-auto"
              }`}
            >
              <div className="text-xs opacity-70 mb-1">{m.role}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3">
          {/* Feedback */}
          {isLoading && (
            <div className="text-white/50 text-sm mb-2">
              Viernes está pensando...
            </div>
          )}

          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

          {/* Composer */}
          <form onSubmit={send} className="flex gap-2">
            <input
              className="flex-1 bg-white/5 text-white placeholder:text-white/40
                  border border-white/15 rounded-lg px-3 py-2
                  focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe..."
              disabled={isLoading}
            />
            <button
              className="bg-white/10 text-white border border-white/15 rounded-lg px-4 py-2
                  hover:bg-white/15 active:bg-white/20 transition disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
