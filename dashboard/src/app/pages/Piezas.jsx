import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { viernesApi } from "@/lib/apis/viernes";

const TIPO_LABEL = {
  encargo: "Encargo",
  venta_general: "Venta general",
};

function formatMonto(monto) {
  if (monto == null) return "—";
  return `$${Number(monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
}

export default function Piezas() {
  const navigate = useNavigate();
  const [piezas, setPiezas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await viernesApi.listPiezas();
      setPiezas(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta pieza? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    try {
      await viernesApi.deletePieza(id);
      setPiezas((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--c-text)" }}>
            Piezas impresas
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--c-text-4)" }}>
            Registro de piezas vendidas o encargadas
          </p>
        </div>
        <button
          onClick={() => navigate("/app/piezas/nueva")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ background: "var(--c-accent)", color: "#fff" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva pieza
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm py-8 text-center" style={{ color: "var(--c-text-4)" }}>Cargando…</div>
      ) : error ? (
        <div className="text-sm py-8 text-center" style={{ color: "#f87171" }}>{error}</div>
      ) : piezas.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-16 gap-3"
          style={{ borderColor: "var(--c-border-med)", color: "var(--c-text-4)" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          <p className="text-sm font-medium">Aún no hay piezas registradas</p>
          <button
            onClick={() => navigate("/app/piezas/nueva")}
            className="text-sm px-4 py-2 rounded-xl font-medium transition-all"
            style={{ background: "var(--c-hover-2)", color: "var(--c-text-2)" }}
          >
            Registrar primera pieza
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--c-border-med)", background: "var(--c-shell)" }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-widest"
            style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-4)", background: "var(--c-hover)" }}
          >
            <span>Pieza</span>
            <span className="text-right w-28">Costo</span>
            <span className="w-32">Tipo</span>
            <span className="w-32">Sincronizado</span>
            <span className="w-8"></span>
          </div>

          {/* Rows */}
          {piezas.map((p, i) => (
            <div
              key={p.id}
              onClick={() => navigate(`/app/piezas/${p.id}`)}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-4 cursor-pointer transition-colors duration-100"
              style={{
                borderBottom: i < piezas.length - 1 ? "1px solid var(--c-border)" : "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
            >
              {/* Nombre + persona */}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--c-text)" }}>{p.nombre}</p>
                {p.persona && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--c-text-4)" }}>{p.persona}</p>
                )}
              </div>

              {/* Monto */}
              <div className="text-sm font-medium text-right w-28 self-center" style={{ color: "var(--c-text-2)" }}>
                {formatMonto(p.monto_pagado)}
              </div>

              {/* Tipo */}
              <div className="w-32 self-center">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: p.tipo === "encargo" ? "rgba(139,92,246,0.15)" : "rgba(20,184,166,0.15)",
                    color: p.tipo === "encargo" ? "#a78bfa" : "#2dd4bf",
                  }}
                >
                  {TIPO_LABEL[p.tipo] ?? p.tipo}
                </span>
              </div>

              {/* Sincronizado */}
              <div className="w-32 self-center">
                {p.sincronizado_sodigic ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                    Sodigic ✓
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--c-text-4)" }}>—</span>
                )}
              </div>

              {/* Delete */}
              <div className="w-8 self-center flex justify-end">
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  disabled={deleting === p.id}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "var(--c-text-4)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-text-4)"; e.currentTarget.style.background = ""; }}
                  title="Eliminar"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
