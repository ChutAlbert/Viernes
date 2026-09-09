# Cómo se calculan los precios

Documenta el sistema de precios de Sodigic: la calculadora de la pantalla
**Precios** y la pestaña **Cálculo** del editor de piezas. Las dos usan el
mismo código, [`dashboard/src/lib/pricing.js`](../dashboard/src/lib/pricing.js),
para que nunca den resultados distintos.

Los ejemplos de este documento se verifican solos:
`node dashboard/src/lib/pricing.check.mjs`.

---

## La idea en una línea

Una pieza se compone de **partes**. Se suma el costo real de todas, se agregan
los extras y la mano de obra, y sobre ese total se ofrecen tres márgenes — con
un precio mínimo que protege las piezas chicas.

```
Costo total = material + máquina + merma + mano de obra + extras
Precio      = MAX(Costo total × margen, precio mínimo)
```

**Una sola fórmula para todo:** chica o grande, un color o multicolor. Lo que
cambia entre piezas son los números, no la lógica.

---

## Por qué se cobra así

Cobrar solo por gramos deja fuera las impresiones lentas. Cobrar solo por tiempo
castiga las piezas ligeras y regala el filamento. Y cobrar por una "tarifa
comercial por minuto" esconde el costo real: cuando no sabes cuánto te cuesta
una pieza, no sabes si la estás vendiendo bien.

Por eso el sistema calcula **costo real** y luego aplica margen. Así siempre ves
las dos cosas: tu piso y tu ganancia.

---

## Los cinco componentes del costo

### 1. Material

```
material = gramos × costo_filamento[material]
```

Los gramos del laminador, siempre. Incluyen soportes, purga y torres de limpieza,
así que no hay que sumarlos aparte.

### 2. Máquina

```
maquina = horas × costo_maquina_por_hora
```

Cubre desgaste, electricidad y mantenimiento. Es un costo bajo por hora, porque
la máquina imprime sola: no es tu tiempo, es su tiempo.

### 3. Merma

```
merma = (material + maquina) × porcentaje_merma
```

Impresiones fallidas, calibraciones, filamento perdido. No es opcional: en el
promedio de los trabajos, un porcentaje siempre se pierde. Si no se cobra aquí,
se paga con la ganancia de los que sí salieron.

### 4. Mano de obra

```
mano_de_obra = horas_trabajo × tarifa_mano_obra
```

**Campo manual.** Solo horas realmente trabajadas con las manos: laminado,
orientación, retiro de soportes, lijado, pegado y ensamble.

No se calcula automáticamente por número de partes — laminar una figura de ocho
piezas es un solo trabajo, no ocho. Se llena a criterio y puede quedar en cero
cuando la pieza no lo amerite.

Es el componente que más se olvida y el que más peso tiene en piezas grandes.

### 5. Extras

```
multicolor  = monto fijo elegido ($30 a $150)
pintado     = horas × tarifa_pintado + materiales
```

**Multicolor ya no es una fórmula aparte.** Antes tenía su propia lógica de
cálculo, lo que hacía que la misma pieza costara tres precios distintos según el
modo elegido. Ahora es un extra fijo que cubre el trabajo de cambios de color y
configuración; el filamento de purga ya viene contado en los gramos.

Ambos extras se suman una sola vez al total de la pieza, no por parte.

---

## El precio mínimo: cómo se cobran las piezas chicas

En una pieza pequeña el costo real **no tiene relación con lo que vale**. Un
llavero de 8 g y 25 minutos:

```
Material      8 g × $0.40      =  $3.20
Máquina   25 min ÷ 60 × $6.85  =  $2.85
Merma 12%                      =  $0.73
                                  -----
Costo                             $6.78   →  ×1.6 = $10.85
```

Once pesos. El cálculo está bien; el problema es que en piezas chicas lo que
cobras no es el plástico, es el laminado, el manejo, el empaque, el traslado al
evento y el hecho de que la pieza exista.

Por eso el precio pasa por un piso:

```
precio = MAX(costo_total × margen, precio_minimo)
```

Guía práctica por rango:

| Peso | Cómo cotizar |
|---|---|
| **Menos de 80 g** | Precio de lista fijo (llavero $80, pokeball $150). La calculadora solo confirma que no pierdes dinero. |
| **80–300 g** | Fórmula, con piso de $200 |
| **300 g o más** | Fórmula pura — aquí ya manda el costo real |

Para el catálogo de eventos conviene guardar el precio fijo en la pieza. Cotizar
un llavero de $80 no debería costar llenar ocho campos.

---

## Referencia de mercado

Junto al resultado se muestra un segundo número, **que no afecta el precio**:

```
referencia = gramos × tarifa_mercado[material]
```

Es la tarifa de venta que se maneja en el mercado mexicano de impresión 3D
—alrededor de $1.20/g en PLA— y que ya trae margen incluido. Sirve como semáforo:

- Si tu precio queda **muy por debajo**, probablemente falta mano de obra o el
  margen es corto.
- Si queda **muy por encima**, el laminado está caro: demasiado relleno, paredes
  de más o soportes evitables. La palanca está en el slicer, no en la fórmula.

No es un método alterno de cobro. Es una verificación gratis.

---

## Valores configurados

### Costo de filamento por gramo

| Material | Costo |
|---|---|
| PLA / PLA+ | $0.40 |
| PETG | $0.52 |
| TPU | $0.70 |

### Operación

| Concepto | Valor |
|---|---|
| Máquina por hora | $6.85 |
| Merma / riesgo | 12% |
| Mano de obra por hora | $120 |
| Pintado por hora | $100 |
| Precio mínimo | $80 |
| Extra multicolor | $30 – $150 |

### Referencia de mercado (informativa)

| Material | Por gramo |
|---|---|
| PLA / PLA+ | $1.20 |
| PETG | $1.50 |
| TPU | $2.00 |

### Márgenes

| Margen | Multiplicador |
|---|---|
| +40% | × 1.4 |
| **+60%** | **× 1.6** ← el sugerido, aparece resaltado |
| +100% | × 2.0 |

En piezas grandes el margen porcentual escala mal: ×1.6 sobre $50 son $30 de
ganancia razonable, pero sobre $1,500 son $900 y el mercado empieza a decir que
no. Arriba de $1,000 de costo conviene bajar a ×1.4.

### Descuentos por volumen

| Cantidad | Descuento |
|---|---|
| 2–4 piezas | 5% |
| 5–9 piezas | 10% |
| 10 o más | 15% |

Aplican sobre el precio final, no sobre el costo.

---

## Ejemplos

### Llavero — 8 g, 25 min, sin trabajo manual

```
Material                        $3.20
Máquina                         $2.85
Merma 12%                       $0.73
Mano de obra                    $0.00
                               ------
Costo total                     $6.78

×1.6 = $10.85  →  aplica mínimo  →  $80.00
Referencia de mercado: $9.60
```

El mínimo manda. Es el resultado correcto.

### Tyranitar 30 cm — 8 partes, 40 h, 800 g, 3 h de trabajo

```
Material     800 g × $0.40  =   $320
Máquina       40 h × $6.85  =   $274
Merma 12%                   =    $71.28
Mano de obra   3 h × $120   =   $360
                               ------
Costo total                    $1,025.28

×1.4 = $1,435
×1.6 = $1,640     ← sugerido
×2.0 = $2,050
Referencia de mercado: $960
```

La referencia queda por debajo del precio, lo cual es esperado en una figura de
ocho partes: la mano de obra pesa más que el plástico. Si la diferencia fuera
mucho mayor, habría que revisar el laminado antes que el precio.

---

## Piezas de varias partes

El botón **+ Agregar pieza / parte** sirve para lo que se imprime por separado y
se ensambla. Cada parte lleva su propio material, tiempo y gramos, y aporta
material y máquina al total.

La merma, la mano de obra, los extras y el precio mínimo se aplican **al total
de la pieza**, no parte por parte.

Ponerle nombre a cada parte es opcional, pero ayuda a recordar por qué el
cálculo quedó así cuando lo revises meses después.

---

## Qué cambió respecto al sistema anterior

| Antes | Ahora |
|---|---|
| Dos fórmulas según modo de color | Una sola fórmula |
| Selector Chica / Grande que apagaba los gramos | Los gramos siempre cuentan; las chicas se protegen con el mínimo |
| Tarifa comercial por minuto ($0.60/min) con margen encima | Costo real de máquina, margen aplicado una vez |
| Multicolor con lógica propia | Multicolor como extra fijo |
| Sin merma | Merma del 12% |
| Mano de obra solo dentro del pintado | Mano de obra como componente propio |
| Sin piso de precio | Precio mínimo con `MAX()` |
| Sin descuentos | Descuentos por volumen |

**Migración:** las piezas guardadas en `catalogo_productos.calculo_partes` traen
los campos `size` y `multi`. Al recalcular, las que estaban en "Un color" van a
cambiar de precio. Conviene correr el recálculo generando un reporte de
antes/después y revisar a mano las que se muevan más del doble antes de publicar
precios nuevos.

---

## Dónde se cambia todo esto

Las tarifas, costos, merma, mano de obra, mínimo y márgenes se editan en la
pestaña de configuración de la pantalla **Precios**.

> **Pendiente:** esa configuración se guarda en el `localStorage` del navegador,
> con la clave `sodigic_pricing_config`. **No está en la base de datos.** Si
> cambias las tarifas en una computadora, en otro navegador o en el móvil siguen
> las anteriores — puedes cotizar $1,800 desde la laptop y $2,400 desde el
> celular sin notarlo. Debe moverse al backend.

El cálculo de cada pieza sí se guarda en la base, en la columna
`catalogo_productos.calculo_partes`.

---

## Para desarrolladores

Una parte es un objeto así:

```js
{ filamentId: 'pla', h: 0, m: 60, g: 30, name: '' }
```

Desaparece `size`. `multi` deja de vivir en la parte y pasa al nivel de la pieza,
como extra:

```js
{
  parts: [...],
  laborHours: 0,
  multicolorFee: 0,
  painting: { enabled: false, hours: 0, materials: 0 }
}
```

El cálculo se separa en dos niveles:

- **`partCost(parte, config)`** devuelve solo material + máquina de esa parte.
- **`piecePrice(pieza, config)`** suma las partes, aplica merma, mano de obra,
  extras, margen y el `MAX()` con el mínimo.

Si algún día hay que cambiar cómo se cobra, esos son los dos únicos lugares que
se tocan: la pantalla Precios y el editor de piezas los comparten.
