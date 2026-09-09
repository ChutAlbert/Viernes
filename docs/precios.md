# Cómo se calculan los precios

Documenta el sistema de precios de Sodigic: la calculadora de la pantalla
**Precios** y la pestaña **Cálculo** del editor de piezas. Las dos usan el
mismo código, [`dashboard/src/lib/pricing.js`](../dashboard/src/lib/pricing.js),
para que nunca den resultados distintos.

---

## La idea en una línea

Una pieza se compone de **partes**. Cada parte tiene su propio costo, se suman
todas, se le agrega el pintado si aplica, y sobre ese total se ofrecen tres
márgenes de venta.

```
Costo base = (suma de las partes) + pintado
Precio     = Costo base × margen
```

---

## Modo de color: la decisión que más cambia el precio

Cada parte se calcula con **una de dos fórmulas**, según el modo de color.
No es una etiqueta: son dos lógicas de negocio distintas.

### Un color

Cobra por **tarifa comercial del material**. Es el modo por defecto.

```
costo = minutos × tarifa_por_minuto
      + gramos  × tarifa_por_gramo     ← solo si el tamaño es Grande
```

### Multicolor

Ignora el material y cobra por **costo real de operación**: lo que gastas en
filamento más lo que cuesta tener la máquina encendida.

```
costo = gramos × costo_filamento_por_gramo
      + horas  × costo_maquina_por_hora
```

**Por qué son distintas:** una impresión multicolor consume filamento de varios
carretes y ocupa la máquina más tiempo por los cambios de color. Cobrarla con la
tarifa por minuto del material no reflejaría ese gasto.

---

## Tamaño: Chica o Grande

Solo aparece y solo aplica en **Un color**, porque es la única fórmula que lo usa.

| Tamaño | Qué se cobra |
|---|---|
| **Grande** | Tiempo **y** gramos |
| **Chica** | Solo tiempo — los gramos no se cobran |

Por eso, al elegir Chica, el campo de gramos se deshabilita: escribir un número
ahí no cambiaría nada.

En **Multicolor** el selector no aparece. Esa fórmula siempre cobra los gramos,
así que el tamaño no cambiaría el resultado y mostrarlo solo confundiría.

---

## Colores

**Ya no se eligen por pieza.** Los colores son globales: se activan y desactivan
desde **Filamentos**, y aplican a todas las piezas del catálogo.

Antes cada pieza tenía su propia paleta, lo que obligaba a repetir el mismo
trabajo en cada una. Los colores tampoco afectan el precio en ninguna de las dos
fórmulas — lo que sí lo afecta es el **modo** (uno o varios) y el **material**.

---

## Valores configurados

### Tarifas por material — solo para Un color

| Material | Por minuto | Por gramo |
|---|---|---|
| PLA / PLA+ | $0.60 | $0.50 |
| PETG | $0.80 | $0.70 |
| TPU | $1.00 | $0.90 |

### Costos de operación — solo para Multicolor

| Concepto | Valor |
|---|---|
| Filamento por gramo | $0.315 |
| Máquina por hora | $6.85 |

### Pintado

```
costo = horas × $100 + materiales
```

Se activa con una casilla y se suma una sola vez al total, no por parte.

### Márgenes

| Margen | Multiplicador |
|---|---|
| +40% | × 1.4 |
| **+60%** | **× 1.6** ← el sugerido, aparece resaltado |
| +100% | × 2.0 |

---

## Ejemplo completo

Pieza **Tyranitar**: PLA, multicolor, 1 hora, 30 gramos.

```
Filamento   30 g × $0.315  =  $9.45
Máquina      1 h × $6.85   =  $6.85
                              ------
Costo base                    $16.30

+40%   $22.82
+60%   $26.08     ← sugerido
+100%  $32.60
```

La misma pieza en **Un color · Grande** costaría muy distinto:

```
Tiempo   60 min × $0.60  =  $36.00
Gramos    30 g  × $0.50  =  $15.00
                            ------
Costo base                  $51.00
```

Y en **Un color · Chica**, $36.00 — solo el tiempo.

Tres precios muy distintos para la misma pieza. Por eso el modo y el tamaño se
eligen a conciencia, no por costumbre.

---

## Piezas de varias partes

El botón **+ Agregar pieza / parte** sirve para lo que se imprime por separado y
se ensambla: un porta-mando con base y figura aparte, por ejemplo.

Cada parte lleva su propio material, modo, tamaño, tiempo y gramos, y se cobra
con su propia fórmula. El costo base es la suma de todas.

Ponerle nombre a cada parte es opcional, pero ayuda a recordar por qué el
cálculo quedó así cuando lo revises meses después.

---

## Dónde se cambia todo esto

Las tarifas, costos, pintado y márgenes se editan en la pestaña de configuración
de la pantalla **Precios**. Los valores de arriba son los que trae por defecto.

> **Ojo:** esa configuración se guarda en el `localStorage` del navegador, con la
> clave `sodigic_pricing_config`. **No está en la base de datos.** Si cambias las
> tarifas en una computadora, en otro navegador o en el móvil siguen las
> anteriores. Para que sean iguales en todos lados habría que moverlas al backend.

El cálculo de cada pieza sí se guarda en la base, en la columna
`catalogo_productos.calculo_partes`, junto con el resto de la pieza.

---

## Para desarrolladores

Una parte es un objeto así:

```js
{ filamentId: 'pla', multi: false, size: 'grande', h: 0, m: 60, g: 30, name: '' }
```

La función que decide todo es `partCost(parte, config)`. Si algún día hay que
cambiar cómo se cobra, **ese es el único lugar que se toca**: la pantalla Precios
y el editor de piezas lo comparten.
