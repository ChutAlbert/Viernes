// Verificación del cálculo de precios. Correr con:  node src/lib/pricing.check.mjs
// Los casos son los ejemplos de docs/precios.md: si cambian los números aquí,
// el documento queda mintiendo.
import assert from "node:assert/strict";
import { DEFAULT_CONFIG as C, piecePrice, volumeDiscount } from "./pricing.js";

const cerca = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

// ── Llavero: 8 g, 25 min, sin trabajo manual → manda el precio mínimo ────────
const llavero = piecePrice(
  { parts: [{ filamentId: "pla", h: 0, m: 25, g: 8 }], laborHours: 0 }, C);

assert(cerca(llavero.impresion, 6.0542), `impresion ${llavero.impresion}`);
assert(cerca(llavero.merma, 0.7265), `merma ${llavero.merma}`);
assert(cerca(llavero.total, 6.7807), `total ${llavero.total}`);
assert(cerca(llavero.referencia, 9.60), `referencia ${llavero.referencia}`);
// 6.78 x 1.6 = 10.85, muy por debajo del minimo de 80
assert(llavero.precios[1].minimoAplicado, "el llavero debe caer al minimo");
assert(cerca(llavero.precios[1].unidad, 80), `precio ${llavero.precios[1].unidad}`);

// ── Tyranitar: 800 g, 40 h, 3 h de mano de obra → manda la fórmula ───────────
const tyra = piecePrice(
  { parts: [{ filamentId: "pla", h: 40, m: 0, g: 800 }], laborHours: 3 }, C);

assert(cerca(tyra.impresion, 594), `impresion ${tyra.impresion}`);
assert(cerca(tyra.merma, 71.28), `merma ${tyra.merma}`);
assert(cerca(tyra.mano, 360), `mano ${tyra.mano}`);
assert(cerca(tyra.total, 1025.28), `total ${tyra.total}`);
assert(cerca(tyra.referencia, 960), `referencia ${tyra.referencia}`);
assert(!tyra.precios[1].minimoAplicado, "Tyranitar no debe tocar el minimo");
assert(cerca(tyra.precios[0].unidad, 1435.39, 1), `+40% ${tyra.precios[0].unidad}`);
assert(cerca(tyra.precios[1].unidad, 1640.45, 1), `+60% ${tyra.precios[1].unidad}`);
assert(cerca(tyra.precios[2].unidad, 2050.56, 1), `+100% ${tyra.precios[2].unidad}`);

// ── Extras: multicolor y pintado suman una sola vez, no por parte ────────────
const extras = piecePrice({
  parts: [{ filamentId: "pla", h: 1, m: 0, g: 100 }, { filamentId: "pla", h: 1, m: 0, g: 100 }],
  laborHours: 0, multicolorFee: 90,
  painting: { enabled: true, hours: 2, materials: 50 },
}, C);
// impresion = 2 x (100x0.40 + 6.85) = 93.70 ; merma = 11.244
assert(cerca(extras.impresion, 93.70), `impresion ${extras.impresion}`);
assert(cerca(extras.pintado, 250), `pintado ${extras.pintado}`);
assert(cerca(extras.total, 93.70 + 11.244 + 250 + 90), `total ${extras.total}`);

// ── Descuentos por volumen ───────────────────────────────────────────────────
assert.equal(volumeDiscount(1, C), 0);
assert.equal(volumeDiscount(3, C), 0.05);
assert.equal(volumeDiscount(7, C), 0.10);
assert.equal(volumeDiscount(50, C), 0.15);

const conDesc = piecePrice(
  { parts: [{ filamentId: "pla", h: 40, m: 0, g: 800 }], laborHours: 3, qty: 10 }, C);
assert(cerca(conDesc.precios[1].unidad, tyra.precios[1].unidad * 0.85, 1),
  `descuento ${conDesc.precios[1].unidad}`);

// ── Datos viejos: las partes guardadas traen size/multi y deben ignorarse ────
const legacy = piecePrice(
  { parts: [{ filamentId: "pla", h: 40, m: 0, g: 800, size: "chica", multi: true }], laborHours: 3 }, C);
assert(cerca(legacy.total, tyra.total), "size/multi viejos no deben alterar el costo");

console.log("pricing: los 6 grupos de casos pasan");
