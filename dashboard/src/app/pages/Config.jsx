import { FEATURE_META, useFeatures, setFeature } from "@/lib/features";

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      style={{
        width: 44, height: 26, borderRadius: 999, position: "relative", cursor: "pointer",
        border: "1px solid var(--c-border-med)", flexShrink: 0,
        background: on ? "var(--c-accent)" : "var(--c-input-bg)", transition: "background .15s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: "50%",
        background: "#fff", transition: "left .15s",
      }} />
    </button>
  );
}

export default function Config() {
  const features = useFeatures();

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "var(--c-text)" }}>Configuración</h1>
      <p style={{ fontSize: 13, color: "var(--c-text-3)", margin: "0 0 20px" }}>Activa o desactiva módulos del sistema.</p>

      <div style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 12, overflow: "hidden" }}>
        {FEATURE_META.map((f, i) => (
          <div
            key={f.key}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              borderTop: i === 0 ? "none" : "1px solid var(--c-border)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)", margin: 0 }}>{f.label}</p>
              {f.hint && <p style={{ fontSize: 12, color: "var(--c-text-3)", margin: "2px 0 0" }}>{f.hint}</p>}
            </div>
            <Toggle on={!!features[f.key]} onChange={(v) => setFeature(f.key, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
