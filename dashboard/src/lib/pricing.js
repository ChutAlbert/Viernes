// Lógica de precios compartida: la usan la calculadora "Precios" y el editor de Piezas.
// Fuente única de verdad para que nunca diverjan.
import { useState, useEffect } from "react";

export const DEFAULT_CONFIG = {
  materials: [
    { id: "pla",  label: "PLA / PLA+", minRate: 0.60, gRate: 0.50 },
    { id: "petg", label: "PETG",       minRate: 0.80, gRate: 0.70 },
    { id: "tpu",  label: "TPU",        minRate: 1.00, gRate: 0.90 },
  ],
  colors: [
    { name: "Negro",   hex: "#1a1a1a" }, { name: "Blanco",  hex: "#f5f5f5" },
    { name: "Gris",    hex: "#8a8a8a" }, { name: "Rojo",    hex: "#e11d48" },
    { name: "Naranja", hex: "#f59e0b" }, { name: "Amarillo",hex: "#eab308" },
    { name: "Verde",   hex: "#22c55e" }, { name: "Azul",    hex: "#3b82f6" },
    { name: "Morado",  hex: "#8b5cf6" },
  ],
  machine_hr: 6.85,
  filament_g: 0.315,
  paint_hr: 100,
  margins: [
    { label: "+40%",  mult: 1.4 },
    { label: "+60%",  mult: 1.6, highlight: true },
    { label: "+100%", mult: 2.0 },
  ],
};

const KEY = "sodigic_pricing_config";

export const num = (v) => parseFloat(v) || 0;
export const int = (v) => Math.max(0, parseInt(v) || 0);
export const mins = (h, m) => int(h) * 60 + int(m);
export const mxn = (n) => `$${Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} MXN`;

export function loadConfig() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
}

export function useConfig() {
  const [config, setConfig] = useState(loadConfig);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(config)); } catch {}
  }, [config]);
  return [config, setConfig];
}

// part: { filamentId, multi, colors[], size:'grande'|'chica', h, m, g }
export function partCost(p, config) {
  const mat = config.materials.find((m) => m.id === p.filamentId) || config.materials[0];
  const minutes = mins(p.h, p.m);
  if (p.multi) {
    return num(p.g) * config.filament_g + (minutes / 60) * config.machine_hr;
  }
  const t = minutes * (mat ? mat.minRate : 0);
  const g = p.size === "grande" ? num(p.g) * (mat ? mat.gRate : 0) : 0;
  return t + g;
}
