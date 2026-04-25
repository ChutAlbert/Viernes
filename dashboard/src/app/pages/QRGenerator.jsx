import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";

// ── Types ──────────────────────────────────────────────────────────────────────

const TYPES = [
  { key: "url",   label: "URL" },
  { key: "text",  label: "Texto" },
  { key: "wifi",  label: "WiFi" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
];

function buildQRString(type, fields) {
  switch (type) {
    case "url":
    case "text":
      return fields.content || "";
    case "wifi":
      return `WIFI:T:${fields.security || "WPA"};S:${fields.ssid || ""};P:${fields.password || ""};;`;
    case "email":
      return `mailto:${fields.email || ""}?subject=${encodeURIComponent(fields.subject || "")}&body=${encodeURIComponent(fields.body || "")}`;
    case "phone":
      return `tel:${fields.phone || ""}`;
    default:
      return "";
  }
}

// ── Field groups ───────────────────────────────────────────────────────────────

function FieldInput({ label, value, onChange, placeholder, type = "text", multiline }) {
  const base = {
    background: "var(--c-shell)",
    border: "1px solid var(--c-border-med)",
    color: "var(--c-text)",
    outline: "none",
    transition: "border-color 0.15s",
  };
  const focusStyle = (e) => e.currentTarget.style.borderColor = "var(--c-accent)";
  const blurStyle  = (e) => e.currentTarget.style.borderColor = "var(--c-border-med)";

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>{label}</label>
      {multiline ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} rows={4}
          className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
          style={base} onFocus={focusStyle} onBlur={blurStyle}
        />
      ) : (
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl text-sm"
          style={base} onFocus={focusStyle} onBlur={blurStyle}
        />
      )}
    </div>
  );
}

function TypeFields({ type, fields, setField }) {
  switch (type) {
    case "url":
      return (
        <FieldInput label="URL" value={fields.content || ""} onChange={(v) => setField("content", v)}
          placeholder="https://ejemplo.com" />
      );
    case "text":
      return (
        <FieldInput label="Texto" value={fields.content || ""} onChange={(v) => setField("content", v)}
          placeholder="Escribe el texto aquí…" multiline />
      );
    case "wifi":
      return (
        <div className="space-y-3">
          <FieldInput label="Nombre de red (SSID)" value={fields.ssid || ""} onChange={(v) => setField("ssid", v)}
            placeholder="Mi Red WiFi" />
          <FieldInput label="Contraseña" value={fields.password || ""} onChange={(v) => setField("password", v)}
            placeholder="••••••••" type="password" />
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Seguridad</label>
            <div className="flex gap-2">
              {["WPA", "WEP", "nopass"].map((s) => (
                <button key={s} type="button" onClick={() => setField("security", s)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={(fields.security || "WPA") === s
                    ? { background: "var(--c-accent)", color: "#fff" }
                    : { background: "var(--c-shell)", border: "1px solid var(--c-border)", color: "var(--c-text-4)" }
                  }
                >{s === "nopass" ? "Abierta" : s}</button>
              ))}
            </div>
          </div>
        </div>
      );
    case "email":
      return (
        <div className="space-y-3">
          <FieldInput label="Correo electrónico" value={fields.email || ""} onChange={(v) => setField("email", v)}
            placeholder="destino@correo.com" type="email" />
          <FieldInput label="Asunto" value={fields.subject || ""} onChange={(v) => setField("subject", v)}
            placeholder="Asunto del correo" />
          <FieldInput label="Cuerpo" value={fields.body || ""} onChange={(v) => setField("body", v)}
            placeholder="Mensaje…" multiline />
        </div>
      );
    case "phone":
      return (
        <FieldInput label="Número de teléfono" value={fields.phone || ""} onChange={(v) => setField("phone", v)}
          placeholder="+52 55 1234 5678" type="tel" />
      );
    default:
      return null;
  }
}

// ── Color picker pill ──────────────────────────────────────────────────────────

function ColorPill({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs" style={{ color: "var(--c-text-3)" }}>{label}</label>
      <label className="relative cursor-pointer">
        <span
          className="block w-7 h-7 rounded-lg border"
          style={{ background: value, borderColor: "var(--c-border-med)" }}
        />
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
      </label>
      <span className="text-xs font-mono" style={{ color: "var(--c-text-4)" }}>{value}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const SIZES = [
  { label: "S", value: 200 },
  { label: "M", value: 300 },
  { label: "L", value: 400 },
  { label: "XL", value: 600 },
];

export default function QRGenerator() {
  const [type, setType] = useState("url");
  const [fields, setFields] = useState({ content: "", security: "WPA" });
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [size, setSize] = useState(300);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef(null);

  const setField = useCallback((key, val) => {
    setFields((prev) => ({ ...prev, [key]: val }));
  }, []);

  const generate = useCallback(async (qrStr) => {
    if (!qrStr.trim()) { setQrDataUrl(null); setError(null); return; }
    try {
      const url = await QRCode.toDataURL(qrStr, {
        width: size,
        margin: 2,
        color: { dark: darkColor, light: lightColor },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(url);
      setError(null);
    } catch (e) {
      setError("No se pudo generar el QR. El contenido puede ser demasiado largo.");
      setQrDataUrl(null);
    }
  }, [size, darkColor, lightColor]);

  // Debounced auto-generate
  useEffect(() => {
    const qrStr = buildQRString(type, fields);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => generate(qrStr), 300);
    return () => clearTimeout(debounceRef.current);
  }, [type, fields, generate]);

  // Reset fields when type changes
  const handleTypeChange = (t) => {
    setType(t);
    setFields({ content: "", security: "WPA" });
    setQrDataUrl(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-${type}-${Date.now()}.png`;
    a.click();
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: copy data url text
      await navigator.clipboard.writeText(qrDataUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrStr = buildQRString(type, fields);
  const hasContent = qrStr.trim().length > 0;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Generador de QR</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--c-text-4)" }}>Crea códigos QR para URLs, WiFi, contactos y más</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left: Config ── */}
        <div className="space-y-4">
          {/* Type selector */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>Tipo</p>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map(({ key, label }) => (
                <button key={key} onClick={() => handleTypeChange(key)}
                  className="px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all"
                  style={type === key
                    ? { background: "var(--c-accent)", color: "#fff" }
                    : { background: "var(--c-shell)", border: "1px solid var(--c-border)", color: "var(--c-text-3)" }
                  }
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>Contenido</p>
            <TypeFields type={type} fields={fields} setField={setField} />
          </div>

          {/* Options */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>Apariencia</p>

            <div className="flex gap-4 flex-wrap">
              <ColorPill label="Color QR" value={darkColor} onChange={setDarkColor} />
              <ColorPill label="Fondo" value={lightColor} onChange={setLightColor} />
            </div>

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--c-text-3)" }}>Tamaño</p>
              <div className="flex gap-2">
                {SIZES.map(({ label, value }) => (
                  <button key={value} onClick={() => setSize(value)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={size === value
                      ? { background: "var(--c-hover-2)", color: "var(--c-text)", border: "1px solid var(--c-accent)44" }
                      : { background: "var(--c-shell)", border: "1px solid var(--c-border)", color: "var(--c-text-4)" }
                    }
                  >{label}<span className="block text-[10px] font-normal mt-0.5" style={{ color: "var(--c-text-4)" }}>{value}px</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="rounded-2xl p-5 flex flex-col items-center gap-5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest self-start" style={{ color: "var(--c-text-4)" }}>Vista previa</p>

          <div className="flex-1 flex items-center justify-center w-full min-h-[240px]">
            {qrDataUrl ? (
              <div className="rounded-2xl overflow-hidden shadow-lg p-3" style={{ background: lightColor }}>
                <img src={qrDataUrl} alt="QR Code" style={{ display: "block", maxWidth: "100%", width: Math.min(size, 320) }} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"
                  style={{ color: "var(--c-border-med)" }}>
                  <rect x="3" y="3" width="5" height="5" rx="0.5"/><rect x="3" y="11" width="5" height="5" rx="0.5"/>
                  <rect x="11" y="3" width="5" height="5" rx="0.5"/><rect x="11" y="11" width="5" height="5" rx="0.5"/>
                  <rect x="16" y="16" width="5" height="5" rx="0.5"/>
                </svg>
                <p className="text-sm" style={{ color: "var(--c-text-4)" }}>
                  {error || "Completa los campos para generar el QR"}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-center px-4" style={{ color: "#ef4444" }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <button
              onClick={handleDownload}
              disabled={!hasContent || !qrDataUrl}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--c-accent)", color: "#fff" }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar PNG
            </button>
            <button
              onClick={handleCopy}
              disabled={!hasContent || !qrDataUrl}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--c-border-med)", color: copied ? "var(--c-accent-text)" : "var(--c-text-3)" }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = "var(--c-hover)"; }}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>

          {/* Raw string preview */}
          {hasContent && (
            <div className="w-full">
              <p className="text-[10px] font-medium mb-1" style={{ color: "var(--c-text-4)" }}>Contenido codificado</p>
              <p className="text-[11px] font-mono break-all px-3 py-2 rounded-xl"
                style={{ background: "var(--c-shell)", color: "var(--c-text-3)", border: "1px solid var(--c-border)" }}>
                {qrStr.length > 120 ? qrStr.slice(0, 120) + "…" : qrStr}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
