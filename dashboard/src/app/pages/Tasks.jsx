import { useState, useEffect, useRef, useCallback } from "react";
import { viernesApi } from "../../lib/apis/viernes";
import { ConfirmModal } from "@viernes/ui/react";

const PRIORITY = {
  high:   { label: "Alta",  color: "#ef4444", bg: "#ef444415", border: "#ef444440" },
  medium: { label: "Media", color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b40" },
  low:    { label: "Baja",  color: "#22c55e", bg: "#22c55e15", border: "#22c55e40" },
};

// ── Scheduled web notification IDs (timeoutIds per task) ──────────────────────
// { taskId: [timeoutId, timeoutId, ...] }
const _notifTimers = {};

function clearTaskTimers(taskId) {
  (_notifTimers[taskId] || []).forEach((id) => clearTimeout(id));
  delete _notifTimers[taskId];
}

function scheduleWebNotifications(task) {
  clearTaskTimers(task.id);
  if (!task.reminders_enabled || !task.due_date || !task.due_time || task.completed) return;
  if (Notification.permission !== "granted") return;

  const [y, mo, d] = task.due_date.split("-").map(Number);
  const [h, m] = task.due_time.split(":").map(Number);
  const dueMs = new Date(y, mo - 1, d, h, m, 0, 0).getTime();
  const now = Date.now();

  const schedule = (offsetMs, title, body) => {
    const fireAt = dueMs - offsetMs - now;
    if (fireAt <= 0) return null;
    return setTimeout(() => new Notification(title, { body, icon: "/favicon.ico" }), fireAt);
  };

  const ids = [];
  if (task.reminder_12h) {
    const id = schedule(12 * 3600 * 1000, "⏰ Tarea en 12 horas", `"${task.title}" vence a las ${task.due_time}`);
    if (id) ids.push(id);
  }
  if (task.reminder_30m) {
    const id = schedule(30 * 60 * 1000, "⏰ Tarea en 30 minutos", `"${task.title}" vence pronto`);
    if (id) ids.push(id);
  }
  if (task.reminder_10m) {
    const id = schedule(10 * 60 * 1000, "🔔 Tarea en 10 minutos", `"${task.title}" vence muy pronto`);
    if (id) ids.push(id);
  }
  if (task.reminder_custom_minutes) {
    const id = schedule(task.reminder_custom_minutes * 60 * 1000,
      `⏰ Tarea en ${task.reminder_custom_minutes} min`, `"${task.title}" vence pronto`);
    if (id) ids.push(id);
  }
  if (ids.length) _notifTimers[task.id] = ids;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconMic = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IconStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
);
const IconPlay = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconBell = ({ active }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

// ── Voice Recorder ─────────────────────────────────────────────────────────────
function VoiceRecorder({ onBlob }) {
  const [phase, setPhase] = useState("idle");
  const [blobUrl, setBlobUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setPhase("done");
        onBlob(blob);
      };
      mr.start(100);
      setPhase("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stop = () => {
    clearInterval(timerRef.current);
    mrRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const clear = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setPhase("idle");
    setDuration(0);
    onBlob(null);
  };

  useEffect(() => () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div>
      {phase === "idle" && (
        <button type="button" onClick={start}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ border: "1px solid var(--c-border-med)", color: "var(--c-text-3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--c-accent)"; e.currentTarget.style.color = "var(--c-accent-text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--c-border-med)"; e.currentTarget.style.color = "var(--c-text-3)"; }}
        >
          <IconMic /> Grabar nota de voz
        </button>
      )}
      {phase === "recording" && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "#ef444415", border: "1px solid #ef444440" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span style={{ color: "#ef4444" }}>Grabando {fmtTime(duration)}</span>
          </div>
          <button type="button" onClick={stop}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: "#ef444415", border: "1px solid #ef444440", color: "#ef4444" }}
          >
            <IconStop /> Detener
          </button>
        </div>
      )}
      {phase === "done" && blobUrl && (
        <div className="flex items-center gap-2 p-2 rounded-xl" style={{ border: "1px solid var(--c-border)" }}>
          <audio src={blobUrl} controls style={{ height: 32, flex: 1, minWidth: 0 }} />
          <button type="button" onClick={clear}
            className="text-xs px-2 py-1 rounded-lg flex-shrink-0 transition-colors"
            style={{ color: "var(--c-text-4)", border: "1px solid var(--c-border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-text-4)"; }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

// ── Reminder Toggle row ────────────────────────────────────────────────────────
function ReminderToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: checked ? "var(--c-accent)" : "transparent",
          border: checked ? "none" : "1.5px solid var(--c-border-med)",
          cursor: "pointer",
        }}
      >
        {checked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </span>
      <span className="text-xs" style={{ color: "var(--c-text-3)" }}>{label}</span>
    </label>
  );
}

// ── Task Modal ─────────────────────────────────────────────────────────────────
function TaskModal({ task, onSave, onClose }) {
  const [title, setTitle]         = useState(task?.title || "");
  const [description, setDesc]    = useState(task?.description || "");
  const [priority, setPriority]   = useState(task?.priority || "medium");
  const [dueDate, setDueDate]     = useState(task?.due_date || "");
  const [dueTime, setDueTime]     = useState(task?.due_time || "");
  const [audioBlob, setAudioBlob] = useState(null);
  const [saving, setSaving]       = useState(false);

  // recordatorios
  const [remindersEnabled, setRemindersEnabled] = useState(task?.reminders_enabled ?? false);
  const [rem12h, setRem12h]   = useState(task?.reminder_12h  ?? true);
  const [rem30m, setRem30m]   = useState(task?.reminder_30m  ?? true);
  const [rem10m, setRem10m]   = useState(task?.reminder_10m  ?? true);
  const [remCustom, setRemCustom] = useState(
    task?.reminder_custom_minutes ? String(task.reminder_custom_minutes) : ""
  );

  const isEdit = !!task;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
        completed: task?.completed || false,
        reminders_enabled:       remindersEnabled,
        reminder_12h:            rem12h,
        reminder_30m:            rem30m,
        reminder_10m:            rem10m,
        reminder_custom_minutes: remCustom ? parseInt(remCustom) : null,
      };
      const saved = isEdit
        ? await viernesApi.updateTask(task.id, payload)
        : await viernesApi.createTask(payload);
      if (audioBlob) {
        const fd = new FormData();
        fd.append("file", audioBlob, "voice_note.webm");
        await viernesApi.uploadTaskAudio(saved.id, fd);
        saved.voice_note_url = `/tasks-audio/${saved.id}_*.webm`;
      }
      onSave(saved, audioBlob);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border-med)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{isEdit ? "Editar tarea" : "Nueva tarea"}</h2>
          <button onClick={onClose} style={{ color: "var(--c-text-4)" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--c-text)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-4)"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Título *</label>
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="¿Qué hay que hacer?"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--c-accent)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--c-border-med)"}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Descripción</label>
            <textarea value={description} onChange={(e) => setDesc(e.target.value)}
              placeholder="Notas adicionales…" rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
              style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--c-accent)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--c-border-med)"}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Prioridad</label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY).map(([key, p]) => (
                <button key={key} type="button" onClick={() => setPriority(key)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={priority === key
                    ? { background: p.bg, border: `1px solid ${p.border}`, color: p.color }
                    : { background: "var(--c-shell)", border: "1px solid var(--c-border)", color: "var(--c-text-4)" }
                  }
                >{p.label}</button>
              ))}
            </div>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Fecha límite</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)", color: "var(--c-text)", colorScheme: "dark" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--c-accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--c-border-med)"}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Hora</label>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--c-shell)", border: "1px solid var(--c-border-med)", color: "var(--c-text)", colorScheme: "dark" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--c-accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--c-border-med)"}
              />
            </div>
          </div>

          {/* ── Recordatorios ── */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
            {/* Toggle header */}
            <button
              type="button"
              onClick={() => setRemindersEnabled((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors"
              style={{ background: remindersEnabled ? "var(--c-accent)18" : "var(--c-shell)" }}
            >
              <span className="flex items-center gap-2 font-medium" style={{ color: remindersEnabled ? "var(--c-accent-text)" : "var(--c-text-3)" }}>
                <IconBell active={remindersEnabled} />
                Recordatorios
              </span>
              {/* toggle pill */}
              <div className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0"
                style={{ background: remindersEnabled ? "var(--c-accent)" : "var(--c-border-med)" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: remindersEnabled ? "18px" : "2px" }} />
              </div>
            </button>

            {/* Options */}
            {remindersEnabled && (
              <div className="px-4 py-3 space-y-2.5" style={{ borderTop: "1px solid var(--c-border)" }}>
                {(!dueDate || !dueTime) && (
                  <p className="text-xs" style={{ color: "#f59e0b" }}>
                    ⚠ Necesitas fecha y hora para programar recordatorios.
                  </p>
                )}
                <ReminderToggle label="12 horas antes" checked={rem12h} onChange={setRem12h} />
                <ReminderToggle label="30 minutos antes" checked={rem30m} onChange={setRem30m} />
                <ReminderToggle label="10 minutos antes" checked={rem10m} onChange={setRem10m} />

                {/* Custom */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs flex-1" style={{ color: "var(--c-text-3)" }}>Personalizado (minutos antes)</span>
                  <input
                    type="number"
                    min="1"
                    value={remCustom}
                    onChange={(e) => setRemCustom(e.target.value)}
                    placeholder="ej. 60"
                    className="w-20 px-2 py-1.5 rounded-lg text-xs outline-none text-center"
                    style={{ background: "var(--c-bg)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "var(--c-accent)"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "var(--c-border-med)"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Voice note */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Nota de voz</label>
              <VoiceRecorder onBlob={setAudioBlob} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--c-border)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm transition-colors"
            style={{ color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--c-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "var(--c-accent)", color: "#fff" }}
          >
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear tarea"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Audio Player ───────────────────────────────────────────────────────────────
function AudioPlayer({ url }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <span>
      {!open ? (
        <button onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          title="Reproducir nota de voz"
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] transition-all"
          style={{ background: "var(--c-accent)18", border: "1px solid var(--c-accent)33", color: "var(--c-accent-text)" }}
        >
          <IconPlay /> Nota de voz
        </button>
      ) : (
        <audio src={url} controls autoPlay style={{ height: 28 }} onClick={(e) => e.stopPropagation()} />
      )}
    </span>
  );
}

// ── Task Card ──────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const p = PRIORITY[task.priority] || PRIORITY.medium;

  const fmtDate = (d) => {
    if (!d) return null;
    const [y, m, day] = d.split("-");
    const today = new Date().toISOString().slice(0, 10);
    const overdue = d < today && !task.completed;
    return { text: `${day}/${m}/${y}`, overdue };
  };
  const date = fmtDate(task.due_date);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-start gap-3 p-4 rounded-2xl transition-all"
      style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", opacity: task.completed ? 0.65 : 1 }}
    >
      {/* Checkbox */}
      <button onClick={() => onToggle(task)}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5"
        style={task.completed
          ? { background: "var(--c-accent)", borderColor: "var(--c-accent)", color: "#fff" }
          : { borderColor: "var(--c-border-med)", color: "transparent" }}
        title={task.completed ? "Marcar pendiente" : "Marcar completada"}
      >
        {task.completed && <IconCheck />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-sm font-medium leading-snug" style={{ color: "var(--c-text)", textDecoration: task.completed ? "line-through" : "none" }}>
            {task.title}
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
            {p.label}
          </span>
        </div>

        {task.description && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--c-text-3)" }}>{task.description}</p>
        )}

        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          {date && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: date.overdue ? "#ef4444" : "var(--c-text-4)" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {date.text}{task.due_time && ` ${task.due_time}`}{date.overdue && " (vencida)"}
            </span>
          )}
          {task.reminders_enabled && (
            <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--c-accent-text)" }}>
              <IconBell active={true} />
              <span>Recordatorios</span>
            </span>
          )}
          {task.voice_note_url && <AudioPlayer url={task.voice_note_url} />}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0" style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}>
        <button onClick={() => onEdit(task)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "var(--c-text-4)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-hover)"; e.currentTarget.style.color = "var(--c-text-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-text-4)"; }}
          title="Editar"
        ><IconEdit /></button>
        <button onClick={() => onDelete(task)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ color: "var(--c-text-4)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#ef444415"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-text-4)"; }}
          title="Eliminar"
        ><IconTrash /></button>
      </div>
    </div>
  );
}

// ── Notification Permission Banner ─────────────────────────────────────────────
function NotifBanner({ onGrant }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || typeof Notification === "undefined") return null;
  if (Notification.permission === "granted") return null;
  if (Notification.permission === "denied") return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm"
      style={{ background: "#f59e0b15", border: "1px solid #f59e0b40" }}>
      <div className="flex items-center gap-2" style={{ color: "#f59e0b" }}>
        <IconBell active={false} />
        <span>Activa las notificaciones del navegador para recibir recordatorios de tareas.</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={async () => {
            const perm = await Notification.requestPermission();
            if (perm === "granted") onGrant();
            setDismissed(true);
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: "#f59e0b", color: "#000" }}
        >Activar</button>
        <button onClick={() => setDismissed(true)}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: "#f59e0b88" }}
        >✕</button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Tasks() {
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("pending");
  const [priorityFilter, setPF]       = useState("all");
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTask, setEditTask]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );

  const load = useCallback(() => {
    viernesApi.listTasks().then((ts) => {
      setTasks(ts);
      // Re-programa notificaciones en cada carga (por si se refresca la página)
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        ts.forEach(scheduleWebNotifications);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Limpia timers al desmontar
  useEffect(() => () => { Object.keys(_notifTimers).forEach(clearTaskTimers); }, []);

  const filtered = tasks.filter((t) => {
    if (filter === "pending" && t.completed) return false;
    if (filter === "done" && !t.completed) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const pending = tasks.filter((t) => !t.completed).length;
  const done    = tasks.filter((t) => t.completed).length;

  const handleToggle = async (task) => {
    const updated = await viernesApi.toggleTaskComplete(task.id).catch(() => null);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      // Si se completó, cancela sus notificaciones
      if (updated.completed) clearTaskTimers(updated.id);
      else if (updated.reminders_enabled) scheduleWebNotifications(updated);
    }
  };

  const handleSave = (saved, hadAudio) => {
    if (editTask) {
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } else {
      if (hadAudio) {
        viernesApi.listTasks().then(setTasks).catch(() => {});
      } else {
        setTasks((prev) => [saved, ...prev]);
      }
    }
    // Reprograma notificaciones para esta tarea
    clearTaskTimers(saved.id);
    if (notifGranted && !saved.completed) scheduleWebNotifications(saved);
    setModalOpen(false);
    setEditTask(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    clearTaskTimers(deleteTarget.id);
    await viernesApi.deleteTask(deleteTarget.id).catch(() => {});
    setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const openCreate = () => { setEditTask(null); setModalOpen(true); };
  const openEdit   = (task) => { setEditTask(task); setModalOpen(true); };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Tareas</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-4)" }}>
            {pending} pendiente{pending !== 1 ? "s" : ""} · {done} completada{done !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "var(--c-accent)", color: "#fff" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva tarea
        </button>
      </div>

      {/* Notification banner */}
      <NotifBanner onGrant={() => {
        setNotifGranted(true);
        tasks.forEach(scheduleWebNotifications);
      }} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
          {[["pending", "Pendientes"], ["all", "Todas"], ["done", "Completadas"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={filter === val
                ? { background: "var(--c-accent)", color: "#fff" }
                : { background: "var(--c-surface)", color: "var(--c-text-3)" }
              }
            >{lbl}</button>
          ))}
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
          {[["all", "Todas"], ["high", "Alta"], ["medium", "Media"], ["low", "Baja"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setPF(val)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={priorityFilter === val
                ? { background: "var(--c-hover-2)", color: "var(--c-text)" }
                : { background: "var(--c-surface)", color: "var(--c-text-4)" }
              }
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--c-accent)", borderTopColor: "transparent" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ color: "var(--c-text-4)" }}>
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p className="text-sm" style={{ color: "var(--c-text-4)" }}>
            {filter === "pending" ? "Sin tareas pendientes" : filter === "done" ? "Sin tareas completadas" : "Sin tareas"}
          </p>
          {filter === "pending" && (
            <button onClick={openCreate} className="text-xs px-3 py-1.5 rounded-xl transition-colors"
              style={{ background: "var(--c-accent)", color: "#fff" }}>
              Crear primera tarea
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task}
              onToggle={handleToggle} onEdit={openEdit} onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <TaskModal task={editTask} onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTask(null); }}
        />
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar tarea"
        description={`¿Eliminar "${deleteTarget?.title}"? No se puede deshacer.`}
        confirmText="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
