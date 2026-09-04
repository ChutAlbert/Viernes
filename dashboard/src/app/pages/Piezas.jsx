import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { viernesApi } from "../../lib/apis/viernes";
import { API_BASE_URL } from "../../lib/apis/client";

const FILTERS = [
  { id: "todas",      label: "Todas" },
  { id: "borradores", label: "Borradores" },
  { id: "catalogo",   label: "En catálogo" },
  { id: "vendidas",   label: "Vendidas" },
];

function estadoDe(p) {
  if (p.es_vendida) return "vendida";
  if (p.publicado) return "catalogo";
  return "borrador";
}

const CHIP = {
  borrador: { label: "Borrador", color: "var(--c-text-3)", bg: "var(--c-hover)" },
  catalogo: { label: "En catálogo", color: "#22d3ee", bg: "rgba(34,211,238,0.14)" },
  vendida:  { label: "Vendida", color: "#22c55e", bg: "rgba(34,197,94,0.14)" },
};

export default function Piezas() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");
  const [creating, setCreating] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [showNew, setShowNew] = useState(false);

  const load = () => {
    setLoading(true);
    viernesApi.listProductosCatalogo().then(setItems).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const crear = async () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    setCreating(true);
    try {
      const p = await viernesApi.createProductoCatalogo({ nombre });
      setShowNew(false); setNuevoNombre("");
      navigate(`/app/piezas/${p.id}`);
    } catch {/* silencioso */} finally { setCreating(false); }
  };

  const visibles = items.filter((p) => {
    const e = estadoDe(p);
    if (filter === "borradores") return e === "borrador";
    if (filter === "catalogo") return e === "catalogo";
    if (filter === "vendidas") return e === "vendida";
    return true;
  });

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--c-text)" }}>Piezas</h1>
          <p style={{ fontSize: 13, color: "var(--c-text-3)", margin: "4px 0 0" }}>Borrador · catálogo · vendida — todo en un solo lugar.</p>
        </div>
        <button onClick={() => setShowNew(true)} style={S.primary}>+ Nueva pieza</button>
      </div>

      {showNew && (
        <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "center" }}>
          <input autoFocus value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && crear()}
            placeholder="Nombre de la pieza (borrador)" style={{ ...S.input, flex: 1 }} />
          <button onClick={crear} disabled={creating || !nuevoNombre.trim()} style={S.primary}>{creating ? "Creando…" : "Crear"}</button>
          <button onClick={() => { setShowNew(false); setNuevoNombre(""); }} style={S.ghost}>Cancelar</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--c-border-med)", margin: "6px 0 18px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ ...S.tab, ...(filter === f.id ? S.tabOn : {}) }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--c-text-3)", fontSize: 14 }}>Cargando…</p>
      ) : visibles.length === 0 ? (
        <p style={{ color: "var(--c-text-4)", fontSize: 14 }}>Nada aquí. Crea una pieza con "+ Nueva pieza".</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {visibles.map((p) => {
            const chip = CHIP[estadoDe(p)];
            const img = p.foto_preview_url ? `${API_BASE_URL}${p.foto_preview_url}` : null;
            return (
              <button key={p.id} onClick={() => navigate(`/app/piezas/${p.id}`)} style={S.item}>
                <div style={{ height: 120, borderRadius: 10, overflow: "hidden", background: "var(--c-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                       : <span style={{ color: "var(--c-text-4)", fontSize: 28 }}>◈</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
                </div>
                <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, color: chip.color, background: chip.bg }}>{chip.label}</span>
                {p.precio_desde != null && <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--c-text-3)" }}>Desde ${p.precio_desde}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  card: { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 14, marginBottom: 14 },
  input: { padding: "8px 11px", border: "1px solid var(--c-border-med)", borderRadius: 8, fontSize: 14, color: "var(--c-text)", background: "var(--c-input-bg)", outline: "none" },
  primary: { fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--c-accent)", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" },
  ghost: { fontSize: 13, color: "var(--c-text-3)", background: "transparent", border: "1px solid var(--c-border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
  tab: { position: "relative", zIndex: 1, padding: "8px 14px", fontSize: 14, fontWeight: 500, color: "var(--c-text-3)", background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid", borderBottomColor: "transparent", cursor: "pointer", marginBottom: -2 },
  tabOn: { color: "var(--c-accent-text)", borderBottomColor: "var(--c-accent)" },
  item: { textAlign: "left", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, padding: 12, cursor: "pointer" },
};
