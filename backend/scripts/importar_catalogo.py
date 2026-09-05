#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Importa la carpeta 'Printing 3D' al catalogo de Viernes.

Una carpeta de modelo = un CatalogoProducto.
  con fotos  -> es_vendida=True, publicado=True   (ya impresa / vendida)
  sin fotos  -> borrador (publicado=False)        (solo nombre + archivo, fotos despues)

Uso:
    set VIERNES_EMAIL=tu@correo    &&  set VIERNES_PASSWORD=...
    python scripts/importar_catalogo.py                       # simulacion, API local
    python scripts/importar_catalogo.py --go                  # importa a local
    python scripts/importar_catalogo.py --api https://viernes.sodigic.com --go

Es idempotente: salta los productos cuyo nombre ya existe.
"""
import argparse
import csv
import os
import sys
import time
from pathlib import Path

import httpx

RAIZ = Path(r"C:\Users\chuch\OneDrive\Documentos\Sodigic\Printing 3D")
CATEGORIAS = [
    "Animales", "Articulados", "Autos", "Cajas y Organizadores", "Cosplay",
    "Ender 3 V3", "Fundas", "Logos", "Macetas", "Personajes", "Personales",
    "Soportes", r"Pokemon\Figuras", r"Pokemon\Llaveros", r"Pokemon\Macetas",
    r"Pokemon\Pokeballs", r"Pokemon\Accesorios",
]
EXT_3D = {".3mf", ".stl", ".obj", ".step", ".stp"}   # lo que acepta /files/upload
EXT_FOTO = {".jpg", ".jpeg", ".png", ".webp"}
MAX_3D = 200 * 1024 * 1024
MAX_FOTO = 10 * 1024 * 1024


def escanear(raiz: Path):
    """Devuelve [{nombre, categoria, archivo, fotos}] una entrada por carpeta de modelo."""
    modelos = []
    for cat in CATEGORIAS:
        d = raiz / cat
        if not d.is_dir():
            continue
        for md in sorted(p for p in d.iterdir() if p.is_dir()):
            fotos = sorted(
                p for p in (md / "Fotos").glob("*")
                if p.suffix.lower() in EXT_FOTO and p.stat().st_size <= MAX_FOTO
            ) if (md / "Fotos").is_dir() else []
            # el .3mf mas grande suele ser el modelo completo; si no hay, cualquier 3D
            c3d = [p for p in md.rglob("*") if p.suffix.lower() in EXT_3D
                   and p.stat().st_size <= MAX_3D and "Fotos" not in p.parts]
            c3d.sort(key=lambda p: (p.suffix.lower() != ".3mf", -p.stat().st_size))
            modelos.append({
                "nombre": md.name,
                "categoria": cat.replace("\\", " / "),
                "archivo": c3d[0] if c3d else None,
                "fotos": fotos,
            })
    return modelos


def subir(cli: httpx.Client, ruta: str, path, intentos: int = 3):
    """Sube un archivo reintentando ante cortes de red. None si nunca paso."""
    for n in range(1, intentos + 1):
        try:
            with open(path, "rb") as fh:
                return cli.post(ruta, files={"file": (path.name, fh)})
        except (httpx.HTTPError, OSError) as e:
            if n == intentos:
                print(f"      fallo tras {intentos} intentos: {path.name} ({type(e).__name__})")
                return None
            espera = 3 * n
            print(f"      reintento {n}/{intentos - 1} en {espera}s: {type(e).__name__}")
            time.sleep(espera)


def token(cli: httpx.Client) -> str:
    if os.getenv("VIERNES_TOKEN"):
        return os.environ["VIERNES_TOKEN"]
    email, pw = os.getenv("VIERNES_EMAIL"), os.getenv("VIERNES_PASSWORD")
    if not (email and pw):
        sys.exit("Falta VIERNES_TOKEN, o VIERNES_EMAIL + VIERNES_PASSWORD en el entorno.")
    r = cli.post("/auth/login", json={"email": email, "password": pw})
    r.raise_for_status()
    return r.json()["access_token"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://127.0.0.1:8000")
    ap.add_argument("--raiz", type=Path, default=RAIZ)
    ap.add_argument("--go", action="store_true", help="ejecuta de verdad (por defecto simula)")
    ap.add_argument("--sin-archivos", action="store_true",
                    help="sube solo nombres y fotos, no los .3mf/.stl (mucho mas ligero)")
    ap.add_argument("--solo", type=int, default=0, help="limita a N modelos, para probar")
    ap.add_argument("--publicar", action="store_true",
                    help="crea ya visible en el portal (por defecto entra apagado para revisar)")
    args = ap.parse_args()

    modelos = escanear(args.raiz)
    if args.solo:
        modelos = modelos[:args.solo]

    vendidas = sum(1 for m in modelos if m["fotos"])
    peso = sum(m["archivo"].stat().st_size for m in modelos if m["archivo"]) / 1e6
    print(f"{len(modelos)} modelos  |  {vendidas} con fotos (vendidas)  |  "
          f"{len(modelos) - vendidas} borradores")
    print(f"{sum(len(m['fotos']) for m in modelos)} fotos  |  "
          f"{'0 (--sin-archivos)' if args.sin_archivos else f'{peso:.0f} MB'} de archivos 3D\n")

    if not args.go:
        for m in modelos:
            estado = f"VENDIDA ({len(m['fotos'])} fotos)" if m["fotos"] else "borrador"
            arch = m["archivo"].name if m["archivo"] else "SIN ARCHIVO"
            print(f"  [{estado:>18}] {m['categoria']:<22} {m['nombre'][:42]:<42} {arch[:38]}")
        print("\n--- SIMULACION. Agrega --go para importar de verdad ---")
        return

    # local_address fuerza salida por IPv4: la regla WAF de Cloudflare esta
    # sobre la IPv4, y por IPv6 la conexion cae en el Managed Challenge.
    cli = httpx.Client(
        base_url=args.api.rstrip("/"),
        timeout=300,
        transport=httpx.HTTPTransport(local_address="0.0.0.0", retries=2),
    )
    cli.headers["Authorization"] = f"Bearer {token(cli)}"

    # Cloudflare corta las subidas en 100 MB; contra localhost no aplica.
    local = "127.0.0.1" in args.api or "localhost" in args.api
    tope = MAX_3D if local else 95 * 1024 * 1024
    grandes, fallos = [], []

    existentes = {p["nombre"] for p in cli.get("/catalogo/productos").raise_for_status().json()}
    print(f"Ya hay {len(existentes)} productos en el catalogo; esos se saltan.\n")

    log = []
    for i, m in enumerate(modelos, 1):
        if m["nombre"] in existentes:
            print(f"  [{i}/{len(modelos)}] salta (ya existe): {m['nombre']}")
            continue

        archivo_url = preview_url = None
        if m["archivo"] and not args.sin_archivos:
            peso = m["archivo"].stat().st_size
            if peso > tope:
                print(f"      OMITIDO {m['archivo'].name} ({peso/1e6:.0f} MB > "
                      f"{tope/1e6:.0f} MB, limite de Cloudflare). Subelo a mano.")
                grandes.append((m["nombre"], m["archivo"], peso))
            else:
                r = subir(cli, "/files/upload", m["archivo"])
                if r is not None and r.status_code == 200:
                    archivo_url = r.json()["url"]
                    preview_url = r.json().get("preview_url")   # render a color del 3mf
                else:
                    est = r.status_code if r is not None else "sin respuesta"
                    print(f"      aviso: no subio {m['archivo'].name} ({est})")
                    fallos.append((m["nombre"], m["archivo"].name, str(est)))

        fotos_url = []
        for f in m["fotos"]:
            r = subir(cli, "/images/upload", f)
            if r is not None and r.status_code == 200:
                fotos_url.append(r.json()["url"])
            else:
                fallos.append((m["nombre"], f.name, "foto"))

        vendida = bool(fotos_url)
        r = cli.post("/catalogo/productos", json={
            "nombre": m["nombre"],
            "descripcion": f"Categoria: {m['categoria']}",
            "archivo_3d_url": archivo_url,
            "foto_preview_url": fotos_url[0] if fotos_url else preview_url,
            # Todo entra apagado: nada visible ni descargable en el portal hasta
            # que se revise a mano. /public/archivo exige publicado AND activo,
            # asi que estas dos banderas tambien bloquean la descarga del 3D.
            "publicado": args.publicar,
            "activo": args.publicar,
            "ver_3d": args.publicar,  # visor 3D apagado hasta revisar cada pieza
            "es_vendida": vendida,    # dato historico, no afecta visibilidad
        })
        if r.status_code not in (200, 201):
            print(f"      ERROR creando {m['nombre']}: {r.status_code} {r.text[:120]}")
            continue
        pid = r.json()["id"]

        for orden, url in enumerate(fotos_url):
            cli.post(f"/catalogo/productos/{pid}/imagenes", json={"url": url, "orden": orden})

        estado = "vendida" if vendida else "nueva"
        estado += "/apagada" if not args.publicar else "/publicada"
        print(f"  [{i}/{len(modelos)}] {estado:<8} #{pid} {m['nombre'][:45]} "
              f"({len(fotos_url)} fotos)")
        log.append([pid, m["categoria"], m["nombre"], estado, archivo_url or "", len(fotos_url)])

    salida = Path(__file__).parent / "importados.csv"
    with open(salida, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "categoria", "nombre", "estado", "archivo_url", "fotos"])
        w.writerows(log)
    print(f"\nListo: {len(log)} productos creados. Registro en {salida}")


if __name__ == "__main__":
    main()
