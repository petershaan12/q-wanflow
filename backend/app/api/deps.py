from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.repository.user_repository import UserRepository
from app.models.user import User
from typing import Optional

reusable_oauth2 = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    token: Optional[HTTPAuthorizationCredentials] = Depends(reusable_oauth2)
) -> User:
    # Try to get token from cookie first
    jwt_token = request.cookies.get("access_token")
    
    # Fallback to header if not in cookie
    if not jwt_token and token:
        jwt_token = token.credentials
        
    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    print(f"[Deps] Verifying token: {jwt_token[:10]}...")
    email = decode_access_token(jwt_token)
    user = UserRepository(db).get_by_email(email)
    if not user:
        print(f"[Deps] User with email {email} not found in DB")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        print(f"[Deps] User {user.email} is inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )
    print(f"[Deps] Successfully authenticated: {user.email}")
    return user
