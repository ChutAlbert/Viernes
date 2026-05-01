import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { viernesApi } from "../../lib/apis/viernes";
import { ConfirmModal } from "@viernes/ui/react";

function GradientCard({ label, value, suffix, gradient }) {
  return (
    <div className={`rounded-2xl p-5 relative overflow-hidden ${gradient}`}>
      <div className="absolute inset-0 bg-white/10 opacity-20 rounded-2xl" />
      <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-3">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-white text-4xl font-bold tracking-tight">{value}</span>
        {suffix && <span className="text-white/60 text-lg mb-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      <p className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>{label}</p>
      <p className="text-2xl font-bold mt-2" style={{ color: "var(--c-text)" }}>{value}</p>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      {children}
    </div>
  );
}

const PRIORITY_WIDGET = {
  high:   { label: "Alta",  color: "#ef4444", bg: "#ef444415" },
  medium: { label: "Media", color: "#f59e0b", bg: "#f59e0b15" },
  low:    { label: "Baja",  color: "#22c55e", bg: "#22c55e15" },
};

function PendingTasksWidget() {
  const [tasks, setTasks] = useState([]);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    viernesApi.pendingTasks().then(setTasks).catch(() => {});
  }, []);

  const handleComplete = async (id) => {
    setCompleting(id);
    try {
      await viernesApi.toggleTaskComplete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {/* silencioso */} finally {
      setCompleting(null);
    }
  };

  const visible = tasks.slice(0, 5);

  return (
    <div className="rounded-2xl p-5 h-full" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Tareas pendientes</p>
          {tasks.length > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>{tasks.length} pendiente{tasks.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <Link to="/app/tareas" className="text-xs transition-colors"
          style={{ color: "var(--c-text-4)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--c-accent-text)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-4)"}
        >Ver todas →</Link>
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--c-text-4)" }}>
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p className="text-xs" style={{ color: "var(--c-text-4)" }}>Todo al día</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {visible.map((t) => {
            const p = PRIORITY_WIDGET[t.priority] || PRIORITY_WIDGET.medium;
            return (
              <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background: "var(--c-hover)" }}>
                <button
                  onClick={() => handleComplete(t.id)}
                  disabled={completing === t.id}
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all disabled:opacity-50"
                  style={{ borderColor: "var(--c-border-med)" }}
                  title="Marcar completada"
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--c-accent)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--c-border-med)"}
                />
                <span className="text-xs flex-1 truncate" style={{ color: "var(--c-text-2)" }}>{t.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium" style={{ background: p.bg, color: p.color }}>
                  {p.label}
                </span>
              </div>
            );
          })}
          {tasks.length > 5 && (
            <Link to="/app/tareas" className="block text-center text-[11px] pt-1 transition-colors"
              style={{ color: "var(--c-text-4)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--c-accent-text)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--c-text-4)"}
            >+{tasks.length - 5} más</Link>
          )}
        </div>
      )}
    </div>
  );
}

function AlertasInventario() {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    viernesApi.getInventarioAlertas().then(setAlertas).catch(() => {});
  }, []);

  if (alertas.length === 0) return null;

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid #f59e0b44" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "#f59e0b" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
          Stock bajo — {alertas.length} {alertas.length === 1 ? "material" : "materiales"}
        </p>
        <Link to="/app/inventario" className="ml-auto text-xs" style={{ color: "var(--c-text-4)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--c-accent-text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-4)"}
        >
          Ver inventario →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {alertas.map(a => (
          <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: "#f59e0b18", border: "1px solid #f59e0b33", color: "var(--c-text-2)" }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#f59e0b" }}/>
            <span className="font-medium">{a.nombre}</span>
            <span style={{ color: "var(--c-text-4)" }}>{a.cantidad_actual} / {a.cantidad_minima} {a.unidad}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemStatusWidget() {
  const [backendOk, setBackendOk] = useState(null);

  useEffect(() => {
    viernesApi.health()
      .then((d) => setBackendOk(d?.status === "ok"))
      .catch(() => setBackendOk(false));
  }, []);

  const services = [
    { label: "Backend API",   status: backendOk === null ? null : backendOk ? "ok" : "warn" },
    { label: "Ollama (LLM)",  status: "ok" },
    { label: "Base de datos", status: "ok" },
    { label: "Gmail OAuth",   status: "warn" },
  ];

  return (
    <Card className="h-full">
      <p className="font-semibold text-sm mb-4" style={{ color: "var(--c-text)" }}>Estado del sistema</p>
      <div className="space-y-3">
        {services.map(({ label, status }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--c-text-3)" }}>{label}</span>
            <span className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: status === "ok" ? "#22c55e" : status === "warn" ? "#f59e0b" : "var(--c-text-4)" }}>
              <span className="w-1.5 h-1.5 rounded-full"
                style={{ background: status === "ok" ? "#22c55e" : status === "warn" ? "#f59e0b" : "var(--c-border-med)" }}/>
              {status === "ok" ? "Activo" : status === "warn" ? "Revisar" : "—"}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [visits, setVisits] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const loadStats = () => {
    viernesApi.visitStats().then(setVisits).catch(() => {});
  };

  useEffect(() => { loadStats(); }, []);

  const fmt = (n) => (n == null ? "—" : n.toLocaleString("es-MX"));

  const handleClear = async () => {
    setConfirmClear(false);
    setClearing(true);
    try {
      await viernesApi.clearVisits();
      await loadStats();
    } catch {/* silencioso */} finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px]">

      <AlertasInventario />

      {/* Visitas al sitio web */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
            Visitas al sitio web
          </p>
          <button
            onClick={() => setConfirmClear(true)}
            disabled={clearing}
            className="text-xs px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text-3)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--c-text-3)"}
          >
            {clearing ? "Borrando…" : "Limpiar visitas"}
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GradientCard label="Total histórico"  value={fmt(visits?.total)}        gradient="bg-gradient-to-br from-violet-600 to-purple-800" />
          <GradientCard label="Últimos 30 días"  value={fmt(visits?.last_30_days)} gradient="bg-gradient-to-br from-cyan-500 to-blue-700" />
          <StatCard label="Esta semana" value={fmt(visits?.last_7_days)} />
          <StatCard label="Hoy"         value={fmt(visits?.today)} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <PendingTasksWidget />
        </div>
        <SystemStatusWidget />
      </div>

      <ConfirmModal
        open={confirmClear}
        title="Borrar visitas"
        description="¿Borrar todas las visitas registradas? No se puede deshacer."
        confirmText="Borrar todo"
        variant="danger"
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
