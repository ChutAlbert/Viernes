import { useEffect, useState } from "react";

// Feature toggles (activar/desactivar módulos). Persisten en localStorage.
// Agrega llaves aquí para nuevos módulos activables.
const KEY = "viernes_features";
const DEFAULTS = {
  precios: true, // calculadora personal del dashboard: activa
};

// Metadatos para la pantalla de Configuración.
export const FEATURE_META = [
  { key: "precios", label: "Calculadora de precios", hint: "En reestructuración. Actívala para usar la versión actual." },
];

const read = () => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return { ...DEFAULTS }; }
};

let features = read();
const subs = new Set();

export function getFeatures() { return features; }

export function setFeature(k, v) {
  features = { ...features, [k]: v };
  try { localStorage.setItem(KEY, JSON.stringify(features)); } catch {}
  subs.forEach((f) => f());
}

export function useFeatures() {
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((x) => x + 1);
    subs.add(cb);
    return () => subs.delete(cb);
  }, []);
  return features;
}
