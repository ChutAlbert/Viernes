# -*- coding: utf-8 -*-
"""Diagnostico de autenticacion: donde exactamente falla el 401."""
import os
import sys

import httpx

API = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
cli = httpx.Client(base_url=API, timeout=30,
                   transport=httpx.HTTPTransport(local_address="0.0.0.0"))

print(f"API: {API}")
r = cli.get("/health")
print(f"  /health -> {r.status_code} {r.text[:80]}")

tok = os.getenv("VIERNES_TOKEN", "")
email = os.getenv("VIERNES_EMAIL", "")
pw = os.getenv("VIERNES_PASSWORD", "")
print(f"\nVIERNES_TOKEN    : {'vacia' if not tok else f'{len(tok)} chars'}")
print(f"VIERNES_EMAIL    : {email or 'vacia'}")
print(f"VIERNES_PASSWORD : {'puesta (' + str(len(pw)) + ' chars)' if pw else 'vacia'}")

if not tok:
    if not (email and pw):
        sys.exit("\nNo hay ni token ni email+password. Pon las variables y reintenta.")
    print("\nHaciendo login...")
    r = cli.post("/auth/login", json={"email": email, "password": pw})
    print(f"  /auth/login -> {r.status_code} {r.text[:160]}")
    if r.status_code != 200:
        sys.exit("El login fallo. Revisa email/password.")
    tok = r.json()["access_token"]
    print(f"  token recibido: {len(tok)} chars")

h = {"Authorization": f"Bearer {tok}"}
for ruta in ("/auth/me", "/catalogo/productos"):
    r = cli.get(ruta, headers=h)
    print(f"  {ruta} -> {r.status_code} {r.text[:160]}")

# Que hay dentro del token (sin verificar firma): revela a que usuario apunta
try:
    import base64
    import json
    p = tok.split(".")[1]
    p += "=" * (-len(p) % 4)
    print("\nContenido del token:", json.loads(base64.urlsafe_b64decode(p)))
except Exception as e:
    print("\nNo se pudo leer el token:", e)
