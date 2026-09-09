import { useState, useEffect } from "react";
import { DEFAULT_CONFIG } from "./pricing";

// Vive aparte de pricing.js para que ese archivo quede sin React y se pueda
// verificar con node (src/lib/pricing.check.mjs).
//
// ponytail: localStorage por ahora. Debe moverse al backend: hoy cada navegador
// tiene sus tarifas y puedes cotizar distinto desde la laptop y desde el móvil.
const KEY = "sodigic_pricing_config";

export function loadConfig() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function useConfig() {
  const [config, setConfig] = useState(loadConfig);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(config)); } catch {}
  }, [config]);
  return [config, setConfig];
}
