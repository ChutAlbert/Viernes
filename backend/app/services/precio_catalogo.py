"""
Servicio de cálculo de precio para el catálogo de impresión 3D.

Algoritmo:
  1. Ajustar el tiempo base según el tamaño elegido (escala lineal)
  2. precio = tiempo_ajustado × filamento.tarifa_por_minuto
  3. Si multicolor: precio_final = precio × 1.5
     Si no:         precio_final = precio

El filamento ya incluye material + color en una sola tarifa, por lo que
no hay multiplicadores separados: 'PLA Arcoíris' tiene su propio precio
distinto al 'PLA Negro'.
"""

from app.models.catalogo import CatalogoProducto, CatalogoFilamento

MULTIPLICADOR_MULTICOLOR = 1.5


def calcular_precio(
    producto: CatalogoProducto,
    filamento: CatalogoFilamento,
    tamano_mm: float,
    multicolor: bool = False,
    num_colores: int = 1,
) -> dict:
    """
    Devuelve el precio final y un desglose de cada paso del cálculo.

    Escalado de tiempo:
      El tiempo base fue medido con `tamano_base_mm`. Para otro tamaño
      se escala linealmente: tiempo_ajustado = tiempo_base × (tamano / tamano_base).
    """
    factor_tamano = tamano_mm / producto.tamano_base_mm
    tiempo_ajustado = producto.tiempo_impresion_minutos * factor_tamano

    precio = tiempo_ajustado * filamento.tarifa_por_minuto

    aplica_multicolor = multicolor and num_colores > 1
    precio_final = precio * MULTIPLICADOR_MULTICOLOR if aplica_multicolor else precio

    return {
        "precio_final": round(precio_final, 2),
        "desglose": {
            "tiempo_base_minutos": producto.tiempo_impresion_minutos,
            "tamano_base_mm": producto.tamano_base_mm,
            "tamano_elegido_mm": tamano_mm,
            "factor_tamano": round(factor_tamano, 4),
            "tiempo_ajustado_minutos": round(tiempo_ajustado, 4),
            "filamento": filamento.nombre,
            "tipo_material": filamento.tipo_material,
            "tarifa_por_minuto": filamento.tarifa_por_minuto,
            "precio_base": round(precio, 2),
            "multicolor": aplica_multicolor,
            "num_colores": num_colores,
            "multiplicador_multicolor": MULTIPLICADOR_MULTICOLOR if aplica_multicolor else 1.0,
            "precio_final": round(precio_final, 2),
        },
    }
