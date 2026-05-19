import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { viernesApi } from "@/lib/apis/viernes";

const TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

function relTime(iso) {
  if (!iso) return "Nunca";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Hace un momento";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

function EditModal({ device, onSave, onClose }) {
  const [name, setName] = useState(device.name || "");
  const [color, setColor] = useState(device.color || "#6366f1");
  const [interval, setInterval] = useState(String(device.update_interval ?? 15));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(device.device_id, { name, color, update_interval: parseInt(interval) || 15 });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-2xl p-6 w-80 space-y-4"
        style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
      >
        <h3 className="text-base font-semibold" style={{ color: "var(--c-text)" }}>
          Editar dispositivo
        </h3>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: "var(--c-bg)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-8 rounded-lg cursor-pointer"
              style={{ border: "1px solid var(--c-border)" }}
            />
            <span className="text-xs font-mono" style={{ color: "var(--c-text-4)" }}>{color}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--c-text-4)" }}>
            Actualizar cada (minutos)
          </label>
          <input
            type="number"
            min="1"
            max="1440"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: "var(--c-bg)", border: "1px solid var(--c-border-med)", color: "var(--c-text)" }}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ border: "1px solid var(--c-border)", color: "var(--c-text-3)" }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity"
            style={{ background: "var(--c-accent)", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Ubicaciones() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const popupsRef = useRef({});

  const [devices, setDevices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await viernesApi.listLocations();
      setDevices(data);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  // Init Mapbox
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !TOKEN) return;
    mapboxgl.accessToken = TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-99.133, 19.432],
      zoom: 10,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers when devices change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(devices.map((d) => d.device_id));

    // Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        delete popupsRef.current[id];
      }
    });

    devices.forEach((d) => {
      if (d.lat == null || d.lng == null) return;

      const popupHtml = `
        <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:2px">${d.name}</div>
        <div style="font-size:11px;color:#aaa">${relTime(d.last_seen)}</div>
        <div style="font-size:11px;color:#666;margin-top:2px">c/${d.update_interval} min</div>
      `;

      if (markersRef.current[d.device_id]) {
        markersRef.current[d.device_id].setLngLat([d.lng, d.lat]);
        const dot = markersRef.current[d.device_id].getElement().querySelector(".marker-dot");
        if (dot) {
          dot.style.background = d.color;
          dot.style.boxShadow = `0 0 10px ${d.color}80`;
        }
        popupsRef.current[d.device_id]?.setHTML(popupHtml);
      } else {
        const el = document.createElement("div");
        el.innerHTML = `<div class="marker-dot" style="width:14px;height:14px;border-radius:50%;background:${d.color};border:2.5px solid #fff;box-shadow:0 0 10px ${d.color}80;cursor:pointer"></div>`;

        const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(popupHtml);
        popupsRef.current[d.device_id] = popup;

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([d.lng, d.lat])
          .setPopup(popup)
          .addTo(map);
        markersRef.current[d.device_id] = marker;
      }
    });
  }, [devices]);

  const flyTo = (d) => {
    if (!d.lat || !d.lng || !mapRef.current) return;
    setActiveId(d.device_id);
    mapRef.current.flyTo({ center: [d.lng, d.lat], zoom: 15, speed: 1.4 });
    const marker = markersRef.current[d.device_id];
    if (marker) {
      if (!marker.getPopup().isOpen()) marker.togglePopup();
    }
  };

  const handleSave = async (deviceId, payload) => {
    const updated = await viernesApi.updateLocation(deviceId, payload);
    setDevices((prev) => prev.map((d) => d.device_id === deviceId ? { ...d, ...updated } : d));
  };

  const handleRequestUpdate = async (deviceId) => {
    setRequesting(deviceId);
    try { await viernesApi.requestLocationUpdate(deviceId); } catch {}
    setTimeout(() => setRequesting((r) => r === deviceId ? null : r), 3000);
  };

  const handleDelete = async (deviceId) => {
    if (!confirm("¿Eliminar este dispositivo del mapa?")) return;
    try {
      await viernesApi.deleteLocation(deviceId);
      markersRef.current[deviceId]?.remove();
      delete markersRef.current[deviceId];
      delete popupsRef.current[deviceId];
      setDevices((prev) => prev.filter((d) => d.device_id !== deviceId));
      if (activeId === deviceId) setActiveId(null);
    } catch {}
  };

  return (
    <div
      className="flex -mx-4 -my-4 md:-mx-6 md:-my-6 overflow-hidden"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {/* ── Device panel ── */}
      <div
        className="w-72 flex-shrink-0 flex flex-col"
        style={{ borderRight: "1px solid var(--c-border)", background: "var(--c-shell)" }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: "1px solid var(--c-border)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
            Dispositivos
            {devices.length > 0 && (
              <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--c-text-4)" }}>
                ({devices.length})
              </span>
            )}
          </span>
          <button
            onClick={load}
            className="text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ background: "var(--c-hover)", color: "var(--c-text-4)" }}
          >
            ↻
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {devices.length === 0 && (
            <p className="text-xs text-center mt-10" style={{ color: "var(--c-text-4)" }}>
              Sin dispositivos registrados.
              <br />
              <span className="mt-1 block">Abre la app móvil para comenzar.</span>
            </p>
          )}

          {devices.map((d) => (
            <div
              key={d.device_id}
              className="rounded-xl p-3 cursor-pointer transition-all"
              style={{
                background: activeId === d.device_id ? "var(--c-hover-2)" : "var(--c-surface)",
                border: `1px solid ${activeId === d.device_id ? "var(--c-border-med)" : "var(--c-border)"}`,
              }}
              onClick={() => flyTo(d)}
            >
              {/* Name + color */}
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: d.color, boxShadow: `0 0 6px ${d.color}80` }}
                />
                <span
                  className="text-sm font-medium flex-1 truncate"
                  style={{ color: "var(--c-text)" }}
                >
                  {d.name}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xs" style={{ color: "var(--c-text-4)" }}>
                  {relTime(d.last_seen)}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--c-hover)", color: "var(--c-text-3)" }}
                >
                  c/{d.update_interval} min
                </span>
                {!d.lat && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--c-red-bg, #2d1515)", color: "#f87171" }}>
                    sin GPS
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setEditing(d)}
                  className="flex-1 text-xs py-1.5 rounded-lg transition-colors"
                  style={{ background: "var(--c-hover)", color: "var(--c-text-3)" }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleRequestUpdate(d.device_id)}
                  disabled={requesting === d.device_id}
                  className="flex-1 text-xs py-1.5 rounded-lg transition-colors"
                  style={{
                    background: requesting === d.device_id ? "var(--c-hover)" : "var(--c-accent-bg, #1e1b4b)",
                    color: requesting === d.device_id ? "var(--c-text-4)" : "var(--c-accent-text)",
                  }}
                >
                  {requesting === d.device_id ? "Solicitado ✓" : "Obtener ahora"}
                </button>
                <button
                  onClick={() => handleDelete(d.device_id)}
                  className="text-xs py-1.5 px-2 rounded-lg transition-colors"
                  style={{ background: "var(--c-hover)", color: "var(--c-text-4)" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        {!TOKEN && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
            style={{ background: "var(--c-bg)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--c-text-3)" }}>
              Token de Mapbox no configurado
            </p>
            <p className="text-xs" style={{ color: "var(--c-text-4)" }}>
              Agrega <code className="font-mono">VITE_MAPBOX_ACCESS_TOKEN</code> en dashboard/.env
            </p>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {editing && (
        <EditModal device={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
