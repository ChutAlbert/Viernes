"""
Upsert del usuario admin: crea si no existe, o actualiza si ya existe.
Uso: docker exec viernes_backend python seed.py
"""
from app.db import SessionLocal
from app.models.user import User
from app.core.security import hash_password

EMAIL = "jesusrico@sodigic.com"
PASSWORD = "Chut1504"

db = SessionLocal()

existing = db.query(User).first()

if existing:
    existing.email = EMAIL
    existing.password_hash = hash_password(PASSWORD)
    existing.is_active = True
    db.commit()
    db.refresh(existing)
    print(f"Usuario actualizado: {existing.email}")
else:
    user = User(email=EMAIL, password_hash=hash_password(PASSWORD), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"Usuario creado: {user.email}")

db.close()
