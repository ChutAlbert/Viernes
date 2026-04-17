"""
Servicio de cálculo de precio para el catálogo de impresión 3D.

Modo calibrado (preferido):
  Si el producto tiene tiempo_minimo_minutos y tiempo_maximo_minutos, se usa
  interpolación log-lineal entre los dos puntos reales del slicer:
    n = log(tiempo_max / tiempo_min) / log(tamano_max / tamano_min)
    tiempo = tiempo_min × (tamano_elegido / tamano_min) ^ n
  Esto calcula el exponente exacto para cada pieza.

Modo fallback:
  Si no hay dos puntos calibrados, usa tiempo_impresion_minutos medido a
  tamano_base_mm con exponente fijo EXPONENTE_ESCALA.

IMPORTANTE (modo fallback): tamano_base_mm debe coincidir EXACTAMENTE con
el tamaño al que se midió tiempo_impresion_minutos en el slicer.
"""

import math
from app.models.catalogo import CatalogoProducto, CatalogoFilamento

MULTIPLICADOR_MULTICOLOR = 1.5
EXPONENTE_ESCALA = 1.6  # fallback cuando no hay dos puntos calibrados


def _interp_log(s: float, s1: float, t1: float, s2: float, t2: float) -> float:
    """Interpolación log-lineal entre dos puntos (s1,t1) y (s2,t2)."""
    n = math.log(t2 / t1) / math.log(s2 / s1)
    return t1 * (s / s1) ** n


def _tiempo_para_tamano(producto: CatalogoProducto, tamano_mm: float) -> float:
    """Calcula los minutos de impresión para un tamaño dado."""
    t_min  = producto.tiempo_minimo_minutos
    t_max  = producto.tiempo_maximo_minutos
    t_base = producto.tiempo_impresion_minutos
    s_min  = producto.tamano_minimo_mm
    s_max  = producto.tamano_maximo_mm
    s_base = producto.tamano_base_mm

    s = max(s_min, min(tamano_mm, s_max))  # clampear al rango

    # Modo 3 puntos: min ─── base ─── max (cada tramo con su propia curva)
    if t_min and t_max and s_min < s_base < s_max:
        if s <= s_base:
            return _interp_log(s, s_min, t_min, s_base, t_base)
        else:
            return _interp_log(s, s_base, t_base, s_max, t_max)

    # Modo 2 puntos: solo min y max (sin base intermedio)
    if t_min and t_max and s_max > s_min and t_max > t_min:
        return _interp_log(s, s_min, t_min, s_max, t_max)

    # Fallback: un solo punto de referencia con exponente fijo
    return t_base * (tamano_mm / s_base) ** EXPONENTE_ESCALA


def calcular_precio(
    producto: CatalogoProducto,
    filamento: CatalogoFilamento,
    tamano_mm: float,
    multicolor: bool = False,
    num_colores: int = 1,
) -> dict:
    tiempo_ajustado = _tiempo_para_tamano(producto, tamano_mm)
    precio = tiempo_ajustado * filamento.tarifa_por_minuto

    aplica_multicolor = multicolor and num_colores > 1
    precio_final = precio * MULTIPLICADOR_MULTICOLOR if aplica_multicolor else precio

    t_min, t_max = producto.tiempo_minimo_minutos, producto.tiempo_maximo_minutos
    s_base = producto.tamano_base_mm
    if t_min and t_max and producto.tamano_minimo_mm < s_base < producto.tamano_maximo_mm:
        modo = "3 puntos"
    elif t_min and t_max:
        modo = "2 puntos"
    else:
        modo = "fallback"

    return {
        "precio_final": round(precio_final, 2),
        "desglose": {
            "modo": modo,
            "tiempo_ajustado_minutos": round(tiempo_ajustado, 2),
            "tamano_elegido_mm": tamano_mm,
            "filamento": filamento.nombre,
            "tipo_material": filamento.tipo_material,
            "tarifa_por_minuto": filamento.tarifa_por_minuto,
            "precio_base": round(precio, 2),
            "multicolor": aplica_multicolor,
            "multiplicador_multicolor": MULTIPLICADOR_MULTICOLOR if aplica_multicolor else 1.0,
            "precio_final": round(precio_final, 2),
        },
    }
