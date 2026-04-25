import json
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token

DEFAULT_ADMIN_PERMISSIONS = None  # admin role bypasses permission checks


class AuthService:
    def setup_first_user(self, db: Session, email: str, password: str, name: str = ""):
        exists = db.query(User).first()
        if exists:
            return None

        user = User(
            email=email,
            name=name,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def login(self, db: Session, email: str, password: str):
        user = db.query(User).filter(User.email == email).first()
        if not user or not user.is_active:
            return None

        if not verify_password(password, user.password_hash):
            return None

        token = create_access_token(subject=str(user.id))
        return token

    def get_user_by_id(self, db: Session, user_id: int):
        return db.query(User).filter(User.id == user_id).first()
