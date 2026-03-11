"""
app/core/security.py
─────────────────────
JWT creation/verification and password hashing.
No FastAPI dependencies here — pure utility functions.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import settings

# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT with `sub` = subject (usually user email)."""
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(timezone.utc) + delta
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> str:
    """Decode JWT and return subject. Raises 401 on any failure."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub: str | None = payload.get("sub")
        if sub is None:
            print("[Security] Token decoded but 'sub' is missing")
            raise ValueError("Missing sub")
        return sub
    except jwt.ExpiredSignatureError:
        print("[Security] Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        print(f"[Security] JWT Decode Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Google OAuth ──────────────────────────────────────────────────────────────

def verify_google_token(token: str) -> dict:
    """Verify a Google token (ID Token or Access Token) and return the claims dict."""
    from google.auth.transport.requests import Request as GoogleRequest
    from google.oauth2 import id_token
    import requests

    client_id = settings.GOOGLE_CLIENT_ID
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured on this server",
        )

    # 1. Try as ID Token
    try:
        # ID tokens are usually JWTs (3 parts separated by dots)
        if token.count('.') == 2:
            info = id_token.verify_oauth2_token(token, GoogleRequest(), client_id)
            if info.get("aud") != client_id:
                raise ValueError("Wrong audience")
            return info
    except Exception as e:
        print(f"[Security] ID Token verification failed: {str(e)}")
        # Fall through to try as access token

    # 2. Try as Access Token
    try:
        response = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            params={"access_token": token}
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"[Security] Access Token verification failed: {str(e)}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Google token",
    )


# ── Password Hashing ──────────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt allows max 72 bytes, truncate to be safe
    return pwd_context.verify(plain_password[:72], hashed_password)

def get_password_hash(password: str) -> str:
    # bcrypt allows max 72 bytes, truncate to be safe
    return pwd_context.hash(password[:72])
