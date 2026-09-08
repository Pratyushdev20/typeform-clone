import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from ..models import models

SECRET_KEY = os.getenv("JWT_SECRET", "typeform-clone-secret-key-2026-production-secure")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    from ..models.crud import ensure_user_starter_forms

    user: Optional[models.User] = None

    if auth and auth.credentials:
        token = auth.credentials.strip()
        # 1. Try local application JWT
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            try:
                user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
            except Exception:
                pass
        
        # 2. Try decoding as Firebase ID token
        if not user:
            try:
                # Decode unverified claims from Firebase JWT
                fb_payload = jwt.decode(token, options={"verify_signature": False})
                fb_email = fb_payload.get("email")
                fb_name = fb_payload.get("name") or (fb_email.split("@")[0] if fb_email else "User")
                if fb_email:
                    user = db.query(models.User).filter(models.User.email == fb_email.lower().strip()).first()
                    if not user:
                        user = models.User(
                            name=fb_name,
                            email=fb_email.lower().strip(),
                            password_hash=hash_password("firebase_authenticated_user")
                        )
                        db.add(user)
                        db.commit()
                        db.refresh(user)
            except Exception:
                pass

    # 3. Fallback default user for unauthenticated or local dev sessions
    if not user:
        user = db.query(models.User).first()
        if not user:
            user = models.User(
                name="Workspace Owner",
                email="workspace@typeform.local",
                password_hash=hash_password("defaultpassword123")
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Ensure this user always has at least 2 starter forms in their workspace (idempotent)
    try:
        ensure_user_starter_forms(db, user.id)
    except Exception as e:
        print(f"Starter forms check warning: {e}")

    return user
