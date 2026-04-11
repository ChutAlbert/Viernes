"""
Crea el usuario por defecto si no existe ninguno.
Uso: docker exec viernes_backend python seed.py
"""
from app.db import SessionLocal
from app.services.auth_service import AuthService

EMAIL = "jesusrico@sodigic.com"
PASSWORD = "Chut1504"

db = SessionLocal()
user = AuthService().setup_first_user(db, EMAIL, PASSWORD)

if user:
    print(f"Usuario creado: {user.email}")
else:
    print("Ya existe un usuario, no se creó nada.")

db.close()
