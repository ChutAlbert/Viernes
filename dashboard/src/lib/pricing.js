// Sistema de precios de Sodigic. Fuente única: la pantalla Precios y la pestaña
// Cálculo del editor de piezas importan de aquí.
//
// Se calcula COSTO REAL y luego se aplica margen, en vez de esconder la ganancia
// dentro de una tarifa. Una sola fórmula para todo: lo que cambia entre piezas
// son los números, no la lógica.
//
// Sin React a propósito: así se puede verificar con `node pricing.check.mjs`.
// El hook de configuración vive en usePricingConfig.js.

export const DEFAULT_CONFIG = {
  materials: [
    { id: "pla",  label: "PLA / PLA+", cost: 0.40, market: 1.20 },
    { id: "petg", label: "PETG",       cost: 0.52, market: 1.50 },
    { id: "tpu",  label: "TPU",        cost: 0.70, market: 2.00 },
  ],
  machine_hr: 6.85,   // desgaste, luz y mantenimiento; es tiempo de la máquina
  waste_pct: 0.12,    // fallidas, calibraciones, filamento perdido
  labor_hr: 120,      // tu tiempo con las manos
  paint_hr: 100,
  min_price: 80,      // piso: en piezas chicas el costo no refleja lo que valen
  multicolor_fees: [0, 30, 60, 90, 120, 150],
  margins: [
    { label: "+40%",  mult: 1.4 },
    { label: "+60%",  mult: 1.6, highlight: true },
    { label: "+100%", mult: 2.0 },
  ],
  volume_discounts: [
    { min: 2,  max: 4,    pct: 0.05 },
    { min: 5,  max: 9,    pct: 0.10 },
    { min: 10, max: null, pct: 0.15 },
  ],
};

export const num = (v) => parseFloat(v) || 0;
export const int = (v) => parseInt(v, 10) || 0;
export const mins = (h, m) => int(h) * 60 + int(m);
export const mxn = (v) =>
  `$${(Math.round(v * 100) / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;

function material(config, id) {
  return config.materials.find((m) => m.id === id) || config.materials[0];
}

/** parte: { filamentId, h, m, g }. Devuelve solo material + máquina. */
export function partCost(p, config) {
  const mat = material(config, p.filamentId);
  const gramos = num(p.g) * (mat ? mat.cost : 0);
  const horas = (mins(p.h, p.m) / 60) * config.machine_hr;
  return gramos + horas;
}

/** Tarifa de venta del mercado. Informativa: no entra en el precio. */
export function marketReference(parts, config) {
  return parts.reduce((s, p) => {
    const mat = material(config, p.filamentId);
    return s + num(p.g) * (mat ? mat.market : 0);
  }, 0);
}

export function volumeDiscount(cantidad, config) {
  const n = int(cantidad) || 1;
  const r = config.volume_discounts.find((d) => n >= d.min && (d.max == null || n <= d.max));
  return r ? r.pct : 0;
}

/**
 * pieza: { parts, laborHours, multicolorFee, painting: {enabled, hours, materials}, qty }
 * Devuelve el desglose completo y los precios por margen.
 */
export function piecePrice(pieza, config) {
  const parts = pieza.parts ?? [];
  const impresion = parts.reduce((s, p) => s + partCost(p, config), 0);
  const merma = impresion * config.waste_pct;
  const mano = num(pieza.laborHours) * config.labor_hr;

  const pin = pieza.painting ?? {};
  const pintado = pin.enabled ? num(pin.hours) * config.paint_hr + num(pin.materials) : 0;
  const multicolor = num(pieza.multicolorFee);

  const total = impresion + merma + mano + pintado + multicolor;
  const desc = volumeDiscount(pieza.qty, config);

  const precios = config.margins.map((m) => {
    // El mínimo se aplica antes del descuento: es el piso de UNA pieza
    const conMargen = Math.max(total * m.mult, config.min_price);
    return {
      ...m,
      unidad: conMargen * (1 - desc),
      minimoAplicado: total * m.mult < config.min_price,
    };
  });

  return {
    impresion, merma, mano, pintado, multicolor, total,
    referencia: marketReference(parts, config),
    descuento: desc,
    cantidad: int(pieza.qty) || 1,
    precios,
  };
}
