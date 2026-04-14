import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { viernesApi } from "../../lib/apis/viernes";

// ── Stat card con gradiente ───────────────────────────────────────────────────
function GradientCard({ label, value, suffix, delta, gradient }) {
  const isPositive = delta && !delta.startsWith("-");
  return (
    <div className={`rounded-2xl p-5 relative overflow-hidden ${gradient}`}>
      <div className="absolute inset-0 bg-white/10 opacity-20 rounded-2xl" />
      <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-3">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-white text-4xl font-bold tracking-tight">{value}</span>
        {suffix && <span className="text-white/60 text-lg mb-0.5">{suffix}</span>}
      </div>
      {delta && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? "bg-white/20" : "bg-black/20"} text-white`}>
          {isPositive ? "▲" : "▼"} {delta}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, delta }) {
  const isPositive = delta && !delta.startsWith("-");
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium" style={{ color: "var(--c-text-3)" }}>{label}</p>
        {delta && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? "bg-[var(--c-cyan-bg)] text-[var(--c-cyan)]" : "bg-red-500/10 text-red-400"}`}>
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-2" style={{ color: "var(--c-text)" }}>{value}</p>
    </div>
  );
}

// Mini line chart
function MiniLineChart({ color }) {
  const points = [30, 55, 40, 70, 50, 85, 60, 68];
  const max = Math.max(...points), min = Math.min(...points);
  const w = 200, h = 56;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(v => h - ((v - min) / (max - min + 1)) * h);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
  const area = `${path} L ${xs[xs.length - 1]} ${h} L 0 ${h} Z`;
  const id = color.replace(/[^a-z]/gi, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 56 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${id})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MiniBarChart() {
  const bars = [
    { day: "L", h: 60 }, { day: "M", h: 20 }, { day: "X", h: 80 },
    { day: "J", h: 50 }, { day: "V", h: 95 }, { day: "S", h: 70 },
  ];
  return (
    <div className="flex items-end gap-1.5 h-16">
      {bars.map(({ day, h }) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-gradient-to-t from-cyan-500 to-cyan-400/60"
            style={{ height: `${h}%` }}
          />
          <span className="text-[9px] font-medium" style={{ color: "var(--c-text-4)" }}>{day}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  let cumulative = 0;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="14"/>
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const offset = -(cumulative / total) * circ;
          cumulative += seg.value;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }}/>
            <span className="text-xs" style={{ color: "var(--c-text-3)" }}>{seg.label}</span>
            <span className="text-xs font-semibold ml-auto pl-2" style={{ color: "var(--c-text-2)" }}>{seg.value}%</span>
          </div>
        ))}
      </div>
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

function CardTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{children}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--c-text-3)" }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [visits, setVisits] = useState(null);

  useEffect(() => {
    viernesApi.visitStats()
      .then(setVisits)
      .catch(() => {/* silencioso si falla */});
  }, []);

  const fmt = (n) => (n == null ? "—" : n.toLocaleString("es-MX"));

  return (
    <div className="space-y-5 max-w-[1400px]">

      {/* Visitas al sitio web */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-4)" }}>
          Visitas al sitio web
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GradientCard label="Total histórico"  value={fmt(visits?.total)}       gradient="bg-gradient-to-br from-violet-600 to-purple-800" />
          <GradientCard label="Últimos 30 días"  value={fmt(visits?.last_30_days)} gradient="bg-gradient-to-br from-cyan-500 to-blue-700" />
          <StatCard label="Esta semana"   value={fmt(visits?.last_7_days)} />
          <StatCard label="Hoy"           value={fmt(visits?.today)} />
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GradientCard label="Tiempo respuesta" value="30" suffix="min" delta="+12%" gradient="bg-gradient-to-br from-violet-600 to-purple-800" />
        <GradientCard label="Tiempo resolución" value="22" suffix="h"   delta="-8%"  gradient="bg-gradient-to-br from-cyan-500 to-blue-700" />
        <StatCard label="Mensajes totales" value="1,284" delta="-20%" />
        <StatCard label="Emails procesados" value="4,531" delta="+33%" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>Actividad del chat</p>
            <div className="flex gap-3 text-xs" style={{ color: "var(--c-text-4)" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-[2px] inline-block" style={{ background: "var(--c-cyan)" }}/>
                Enviados
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-[2px] inline-block bg-violet-400"/>
                Respondidos
              </span>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--c-text-4)" }}>Mensajes enviados vs respondidos</p>
          <div className="space-y-1">
            <MiniLineChart color="var(--c-cyan)" />
            <MiniLineChart color="#a78bfa" />
          </div>
          <div className="flex justify-between mt-3 text-[10px]" style={{ color: "var(--c-text-4)" }}>
            {["Ene","Feb","Mar","Abr","May","Jun","Jul"].map(m => <span key={m}>{m}</span>)}
          </div>
        </Card>

        <Card>
          <CardTitle sub="Por categoría">Servicios activos</CardTitle>
          <DonutChart segments={[
            { label: "Software",     value: 44, color: "var(--c-cyan)" },
            { label: "Impresión 3D", value: 25, color: "#a78bfa" },
            { label: "Diseño",       value: 19, color: "#f59e0b" },
            { label: "Consultoría",  value: 12, color: "#22c55e" },
          ]}/>
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
            <Link to="/app/website" className="text-xs transition-colors hover:opacity-80" style={{ color: "var(--c-accent-text)" }}>
              Gestionar servicios →
            </Link>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardTitle sub="Esta semana">Mensajes / día</CardTitle>
          <MiniBarChart />
        </Card>

        <Card>
          <CardTitle>Accesos rápidos</CardTitle>
          <div className="space-y-1">
            {[
              { to: "/app/chat",    label: "Iniciar chat IA",    dot: "var(--c-accent-text)" },
              { to: "/app/gmail",   label: "Ver bandeja Gmail",  dot: "var(--c-cyan)" },
              { to: "/app/docs",    label: "Subir documento",    dot: "#f59e0b" },
              { to: "/app/website", label: "Editar servicios",   dot: "#22c55e" },
            ].map(({ to, label, dot }) => (
              <Link key={to} to={to} className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
                style={{ color: "var(--c-text-3)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--c-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }}/>
                <span className="text-sm" style={{ color: "var(--c-text-2)" }}>{label}</span>
                <span className="ml-auto text-xs" style={{ color: "var(--c-text-4)" }}>→</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Estado del sistema</CardTitle>
          <div className="space-y-3">
            {[
              { label: "Backend API",   status: "ok" },
              { label: "Ollama (LLM)",  status: "ok" },
              { label: "Base de datos", status: "ok" },
              { label: "Gmail OAuth",   status: "warn" },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--c-text-3)" }}>{label}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: status === "ok" ? "#22c55e" : "#f59e0b" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === "ok" ? "#22c55e" : "#f59e0b" }}/>
                  {status === "ok" ? "Activo" : "Revisar"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
